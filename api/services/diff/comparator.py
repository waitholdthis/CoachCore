"""
Rule Diff Generator: bilateral comparison between two rule contexts.
"""
from __future__ import annotations
import json
from datetime import datetime
from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.diff import DiffEntry, RuleDiff, DiffContext
from schemas.rule import ActiveRule
from services.rules.resolver import resolve_rules
from config import get_settings

settings = get_settings()
_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


_DIFF_CLASSIFICATION_PROMPT = """Two youth sports rules for comparison:

HOME RULE: {home_text}
AWAY RULE: {away_text}

Is the AWAY rule MORE_RESTRICTIVE, MORE_PERMISSIVE, or FUNDAMENTALLY_DIFFERENT compared to HOME?
Describe the key difference in one concise sentence.

Return ONLY JSON: {{"diff_type": "MORE_RESTRICTIVE|MORE_PERMISSIVE|FUNDAMENTALLY_DIFFERENT", "key_difference": "...", "severity_score": 0.0}}
severity_score: 0.0 (cosmetic) to 1.0 (game-changing)"""


async def _classify_diff(home_text: str, away_text: str) -> tuple[str, str, float]:
    """Use Claude to classify how two rules differ."""
    response = await get_client().messages.create(
        model=settings.llm_fast_model,
        max_tokens=200,
        temperature=0,
        messages=[{"role": "user", "content": _DIFF_CLASSIFICATION_PROMPT.format(
            home_text=home_text,
            away_text=away_text,
        )}],
    )
    raw = response.content[0].text.strip()
    try:
        data = json.loads(raw)
        return data["diff_type"], data.get("key_difference", ""), float(data.get("severity_score", 0.5))
    except (json.JSONDecodeError, KeyError, ValueError):
        return "FUNDAMENTALLY_DIFFERENT", "Rules differ in content.", 0.5


async def generate_diff(
    session: AsyncSession,
    home: DiffContext,
    away: DiffContext,
) -> RuleDiff:
    """Compare two rule contexts and return a structured diff."""
    home_rules = await resolve_rules(
        session,
        sport=home.sport.value,
        age_bracket=home.age_bracket,
        division_type=home.division_type,
        league_id=home.league_id,
    )
    away_rules = await resolve_rules(
        session,
        sport=away.sport.value,
        age_bracket=away.age_bracket,
        division_type=away.division_type,
        league_id=away.league_id,
    )

    # Index by (category, subcategory)
    away_index: dict[tuple[str, str | None], ActiveRule] = {
        (r.category, r.subcategory): r for r in away_rules
    }
    home_index: dict[tuple[str, str | None], ActiveRule] = {
        (r.category, r.subcategory): r for r in home_rules
    }

    entries: list[DiffEntry] = []

    # Compare home rules against away
    for home_rule in home_rules:
        key = (home_rule.category, home_rule.subcategory)
        away_rule = away_index.get(key)

        if away_rule is None:
            entries.append(DiffEntry(
                category=home_rule.category,
                subcategory=home_rule.subcategory,
                diff_type="MISSING_IN_AWAY",
                severity_score=0.4,
                safety_critical=home_rule.safety_critical,
                home_rule_text=home_rule.canonical_text,
                home_rule_source=home_rule.provenance_source,
                away_rule_text=None,
                away_rule_source=None,
                key_difference=f"Away location has no rule for {home_rule.category}.",
            ))
            continue

        # Quick hash comparison — if texts are identical, skip
        if home_rule.canonical_text.strip() == away_rule.canonical_text.strip():
            continue

        # LLM classification for non-identical rules
        diff_type, key_diff, severity = await _classify_diff(
            home_rule.canonical_text,
            away_rule.canonical_text,
        )

        # Safety-critical diffs get severity floor of 0.8
        is_safety = home_rule.safety_critical or away_rule.safety_critical
        if is_safety:
            severity = max(severity, 0.8)

        entries.append(DiffEntry(
            category=home_rule.category,
            subcategory=home_rule.subcategory,
            diff_type=diff_type,
            severity_score=severity,
            safety_critical=is_safety,
            home_rule_text=home_rule.canonical_text,
            home_rule_source=home_rule.provenance_source,
            away_rule_text=away_rule.canonical_text,
            away_rule_source=away_rule.provenance_source,
            key_difference=key_diff,
        ))

    # Rules present in away but not in home
    for away_rule in away_rules:
        key = (away_rule.category, away_rule.subcategory)
        if key not in home_index:
            entries.append(DiffEntry(
                category=away_rule.category,
                subcategory=away_rule.subcategory,
                diff_type="MISSING_IN_HOME",
                severity_score=0.4,
                safety_critical=away_rule.safety_critical,
                home_rule_text=None,
                home_rule_source=None,
                away_rule_text=away_rule.canonical_text,
                away_rule_source=away_rule.provenance_source,
                key_difference=f"Away location adds a rule for {away_rule.category} not in your home rulebook.",
            ))

    # Sort: safety-critical first, then by severity
    entries.sort(key=lambda e: (not e.safety_critical, -e.severity_score))

    safety_critical_count = sum(1 for e in entries if e.safety_critical)

    return RuleDiff(
        home=home,
        away=away,
        entries=entries,
        total_differences=len(entries),
        safety_critical_differences=safety_critical_count,
        generated_at=datetime.utcnow(),
    )
