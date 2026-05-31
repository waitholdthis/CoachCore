"""
Three-pass conflict detection engine.
Pass 1: Semantic similarity search against baseline rules.
Pass 2: LLM classification of conflict type.
Pass 3: Scope intersection validation.
"""
from __future__ import annotations
import json
from uuid import UUID
from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from models.rule import Rule
from models.conflict import ConflictRecord
from models.enums import Sport, ConflictType, ConflictResolution, RuleTier, SAFETY_CRITICAL_CATEGORIES
from services.ingestion.embedder import embed_single
from config import get_settings

settings = get_settings()
_anthropic: AsyncAnthropic | None = None


def get_anthropic() -> AsyncAnthropic:
    global _anthropic
    if _anthropic is None:
        _anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic


_CONFLICT_CLASSIFICATION_PROMPT = """You are analyzing two sports rules to determine their relationship.

BASELINE RULE (universal standard):
{baseline_text}
Category: {baseline_category} | Scope: {baseline_scope}

LOCAL RULE (from uploaded league rulebook):
{local_text}
Category: {local_category} | Scope: {local_scope}

Classify the relationship of LOCAL relative to BASELINE:
- RESTRICT: local rule narrows or makes the baseline MORE restrictive
- EXPAND: local rule loosens or makes the baseline MORE permissive
- OVERRIDE: local rule completely replaces the baseline for its scope
- SUPPLEMENT: local rule adds a case not covered by baseline
- CONFLICT: rules are directly contradictory with no clear hierarchy
- UNRELATED: no meaningful overlap in subject matter

Also describe the key difference in one sentence.
Estimate your confidence (0.0-1.0).

Respond ONLY with valid JSON:
{{"classification": "RESTRICT|EXPAND|OVERRIDE|SUPPLEMENT|CONFLICT|UNRELATED", "key_difference": "...", "confidence": 0.0}}"""


async def _classify_conflict(
    baseline: Rule,
    local: Rule,
) -> tuple[str, str, float]:
    """Call Claude to classify the conflict type. Returns (classification, key_difference, confidence)."""
    prompt = _CONFLICT_CLASSIFICATION_PROMPT.format(
        baseline_text=baseline.canonical_text,
        baseline_category=baseline.category,
        baseline_scope=json.dumps(baseline.scope or {}),
        local_text=local.canonical_text,
        local_category=local.category,
        local_scope=json.dumps(local.scope or {}),
    )

    response = await get_anthropic().messages.create(
        model=settings.llm_fast_model,
        max_tokens=256,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    try:
        data = json.loads(raw)
        return data["classification"], data.get("key_difference", ""), float(data.get("confidence", 0.7))
    except (json.JSONDecodeError, KeyError):
        return "UNRELATED", "", 0.5


def _scopes_overlap(local_scope: dict, baseline_scope: dict) -> bool:
    """Pass 3: Check whether the scopes of two rules actually intersect."""
    local_ages = set(local_scope.get("age_brackets", ["all"]))
    baseline_ages = set(baseline_scope.get("age_brackets", ["all"]))
    local_divs = set(local_scope.get("division_types", ["all"]))
    baseline_divs = set(baseline_scope.get("division_types", ["all"]))

    age_overlap = (
        "all" in local_ages
        or "all" in baseline_ages
        or bool(local_ages & baseline_ages)
    )
    div_overlap = (
        "all" in local_divs
        or "all" in baseline_divs
        or bool(local_divs & baseline_divs)
    )
    return age_overlap and div_overlap


def _build_flag_message(
    conflict_type: str,
    baseline: Rule,
    local: Rule,
    key_difference: str,
) -> str:
    """Generate the human-readable flag message shown to coaches."""
    type_phrases = {
        "RESTRICT": "is MORE RESTRICTIVE than",
        "EXPAND": "is MORE PERMISSIVE than",
        "OVERRIDE": "COMPLETELY OVERRIDES",
        "SUPPLEMENT": "ADDS TO",
        "CONFLICT": "DIRECTLY CONFLICTS WITH",
    }
    phrase = type_phrases.get(conflict_type, "differs from")

    source_ref = ""
    if local.source_page:
        source_ref = f" (See uploaded doc p.{local.source_page}"
        if local.source_paragraph:
            source_ref += f", §{local.source_paragraph}"
        source_ref += ")"

    return (
        f"Your league's rule {phrase} the standard {baseline.category} rule. "
        f"{key_difference}{source_ref}"
    )


async def detect_conflicts_for_rule(
    local_rule: Rule,
    session: AsyncSession,
    league_id: UUID,
) -> list[ConflictRecord]:
    """Run the three-pass conflict detection for a single local rule."""
    if local_rule.embedding is None:
        return []

    # Pass 1: Semantic similarity search against baseline rules
    embedding_list = list(local_rule.embedding) if hasattr(local_rule.embedding, '__iter__') else local_rule.embedding

    similarity_query = text("""
        SELECT id, 1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM rules
        WHERE rule_tier = 'baseline'
          AND sport = :sport
          AND embedding IS NOT NULL
          AND id != :rule_id
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT 5
    """)

    result = await session.execute(similarity_query, {
        "embedding": str(embedding_list),
        "sport": local_rule.sport.value if hasattr(local_rule.sport, 'value') else local_rule.sport,
        "rule_id": str(local_rule.id),
    })
    candidates = result.fetchall()

    conflicts: list[ConflictRecord] = []

    for row in candidates:
        similarity = float(row.similarity)
        if similarity < settings.similarity_threshold:
            continue

        baseline = await session.get(Rule, row.id)
        if not baseline:
            continue

        # Pass 2: LLM classification
        classification, key_difference, confidence = await _classify_conflict(baseline, local_rule)

        if classification in ("UNRELATED",):
            continue

        # Pass 3: Scope intersection validation
        if not _scopes_overlap(local_rule.scope or {}, baseline.scope or {}):
            continue

        # Determine if safety-critical
        sport_key = local_rule.sport if isinstance(local_rule.sport, Sport) else Sport(local_rule.sport)
        safety_cats = SAFETY_CRITICAL_CATEGORIES.get(sport_key, [])
        is_safety = local_rule.category in safety_cats or baseline.category in safety_cats

        # Build effective scope (intersection)
        local_ages = set(local_rule.scope.get("age_brackets", ["all"]))
        baseline_ages = set(baseline.scope.get("age_brackets", ["all"]))
        effective_ages = (
            list(local_ages)
            if "all" in baseline_ages
            else list(baseline_ages)
            if "all" in local_ages
            else list(local_ages & baseline_ages)
        )

        # Safety rule expanding (more permissive) needs extra flag
        if is_safety and classification == "EXPAND":
            key_difference = (
                f"⛔ SAFETY: This local rule is MORE PERMISSIVE than the standard safety guideline. "
                f"Requires admin review. {key_difference}"
            )

        try:
            conflict_type = ConflictType(classification)
        except ValueError:
            conflict_type = ConflictType.conflict

        conflict = ConflictRecord(
            league_id=league_id,
            sport=local_rule.sport,
            conflict_type=conflict_type,
            effective_scope={
                "age_brackets": effective_ages,
                "division_types": list(set(local_rule.scope.get("division_types", ["all"]))),
                "temporal_qualifier": (local_rule.scope or {}).get("temporal_qualifier"),
            },
            baseline_rule_id=baseline.id,
            local_rule_id=local_rule.id,
            similarity_score=similarity,
            classification_confidence=confidence,
            resolution=ConflictResolution.local_overrides if classification != "CONFLICT" else ConflictResolution.pending_review,
            coach_flag=True,
            flag_message=_build_flag_message(classification, baseline, local_rule, key_difference),
            safety_critical=is_safety,
        )
        conflicts.append(conflict)

    return conflicts


async def run_conflict_detection(
    local_rules: list[Rule],
    session: AsyncSession,
    league_id: UUID,
) -> list[ConflictRecord]:
    """Run conflict detection across all newly ingested local rules."""
    all_conflicts: list[ConflictRecord] = []
    for rule in local_rules:
        conflicts = await detect_conflicts_for_rule(rule, session, league_id)
        all_conflicts.extend(conflicts)
        for c in conflicts:
            session.add(c)
    await session.commit()
    return all_conflicts
