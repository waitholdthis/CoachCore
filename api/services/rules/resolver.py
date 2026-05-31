"""
Layered rule resolution engine.
Priority: tournament → league_local → governing_body → sport_age_defaults → universal_baseline
"""
from __future__ import annotations
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from models.rule import Rule
from models.conflict import ConflictRecord
from models.enums import RuleTier, ConflictResolution
from schemas.rule import ActiveRule, RuleScope


async def resolve_rules(
    session: AsyncSession,
    sport: str,
    age_bracket: str,
    division_type: str = "all",
    league_id: UUID | None = None,
    tournament_id: UUID | None = None,
) -> list[ActiveRule]:
    """
    Return the merged, de-duplicated active rule set for the given context.
    Rules are organized by category+subcategory; the highest-priority tier wins.
    """
    # Fetch all potentially applicable rules
    stmt = select(Rule).where(
        and_(
            Rule.sport == sport,
            Rule.superseded_by_id.is_(None),
        )
    )
    result = await session.execute(stmt)
    all_rules: list[Rule] = list(result.scalars().all())

    # Filter by scope relevance
    relevant = [r for r in all_rules if _scope_matches(r, age_bracket, division_type)]

    # Group by (category, subcategory) and apply priority
    rule_map: dict[tuple[str, str | None], Rule] = {}

    priority_order = [
        RuleTier.baseline,
        RuleTier.governing_body,
        RuleTier.local,
        RuleTier.tournament,
    ]

    for tier in priority_order:
        for rule in relevant:
            if rule.rule_tier != tier:
                continue
            # Only apply local rules that belong to the requested league
            if tier == RuleTier.local and league_id and rule.league_id != league_id:
                continue
            if tier == RuleTier.tournament and tournament_id and rule.league_id != tournament_id:
                continue

            key = (rule.category, rule.subcategory)
            rule_map[key] = rule  # Higher-priority tier overwrites lower

    # Convert to ActiveRule with provenance
    active_rules: list[ActiveRule] = []
    for (category, subcategory), rule in rule_map.items():
        active_rule = _to_active_rule(rule)
        active_rules.append(active_rule)

    # Sort: safety-critical first, then by display_priority
    active_rules.sort(key=lambda r: (not r.safety_critical, r.display_priority))
    return active_rules


def _scope_matches(rule: Rule, age_bracket: str, division_type: str) -> bool:
    """Check whether a rule's scope covers the requested age bracket and division type."""
    scope = rule.scope or {}
    age_brackets = scope.get("age_brackets", ["all"])
    division_types = scope.get("division_types", ["all"])

    age_match = "all" in age_brackets or age_bracket in age_brackets
    div_match = "all" in division_types or division_type in division_types or division_type == "all"
    return age_match and div_match


def _to_active_rule(rule: Rule) -> ActiveRule:
    scope = rule.scope or {}
    return ActiveRule(
        id=rule.id,
        sport=rule.sport,
        category=rule.category,
        subcategory=rule.subcategory,
        rule_tier=rule.rule_tier,
        rule_type=rule.rule_type,
        canonical_text=rule.canonical_text,
        plain_language_text=rule.plain_language_text,
        scope=RuleScope(
            age_brackets=scope.get("age_brackets", ["all"]),
            division_types=scope.get("division_types", ["all"]),
            league_levels=scope.get("league_levels", ["all"]),
            temporal_qualifier=scope.get("temporal_qualifier"),
        ),
        safety_critical=rule.safety_critical,
        game_day_critical=rule.game_day_critical,
        display_priority=rule.display_priority,
        numeric_value=rule.numeric_value,
        numeric_unit=rule.numeric_unit,
        governing_body_source=rule.governing_body_source,
        tags=rule.tags or [],
        normative_certainty=rule.normative_certainty,
        human_resolved=rule.human_resolved,
        human_resolution_choice=rule.human_resolution_choice,
        league_id=rule.league_id,
        upload_id=rule.upload_id,
        source_page=rule.source_page,
        source_paragraph=rule.source_paragraph,
        created_at=rule.created_at,
        updated_at=rule.updated_at,
        provenance_tier=rule.rule_tier,
        provenance_source=rule.governing_body_source or (
            "Local Rulebook" if rule.rule_tier == RuleTier.local else "Baseline Standard"
        ),
        overridden_by_local=rule.rule_tier == RuleTier.local,
    )
