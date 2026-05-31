"""
Quick Reference Card builder.
Selects and organizes game-day-critical rules into the 3-tier display format.
"""
from __future__ import annotations
import hashlib
from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from schemas.rule import ActiveRule, QuickRefCard
from services.rules.resolver import resolve_rules
from models.enums import Sport, SAFETY_CRITICAL_CATEGORIES


async def build_quick_ref(
    session: AsyncSession,
    sport: str,
    age_bracket: str,
    division_type: str = "recreational",
    league_id: UUID | None = None,
) -> QuickRefCard:
    """Build the Game-Day Quick Reference card for a given context."""
    all_rules = await resolve_rules(
        session, sport, age_bracket, division_type, league_id
    )

    # Tier 1: game_day_critical rules, sorted by display_priority — max 4 slots
    tier_1_rules = [r for r in all_rules if r.game_day_critical][:4]

    # Tier 2: remaining rules with display_priority ≤ 30 — max 8 slots
    tier_2_rules = [
        r for r in all_rules
        if not r.game_day_critical and r.display_priority <= 30
    ][:8]

    # Local overrides: rules that came from the league's uploaded rulebook
    from models.enums import RuleTier
    local_overrides = [r for r in all_rules if r.rule_tier == RuleTier.local]

    # Safety flags: active safety-critical rules
    sport_enum = Sport(sport)
    safety_cats = SAFETY_CRITICAL_CATEGORIES.get(sport_enum, [])
    safety_flags = [r for r in all_rules if r.safety_critical and r.category in safety_cats]

    # Stable share token based on context parameters
    share_token = _generate_share_token(sport, age_bracket, division_type, str(league_id or ""))

    # Fetch league name if league_id provided
    league_name: str | None = None
    if league_id:
        from sqlalchemy import select
        from models.league import League
        result = await session.execute(select(League.name).where(League.id == league_id))
        league_name = result.scalar_one_or_none()

    return QuickRefCard(
        sport=sport,
        age_bracket=age_bracket,
        league_id=league_id,
        league_name=league_name,
        tier_1=tier_1_rules,
        tier_2=tier_2_rules,
        local_override_count=len(local_overrides),
        local_overrides=local_overrides,
        safety_flags=safety_flags,
        generated_at=datetime.utcnow(),
        share_token=share_token,
    )


def _generate_share_token(sport: str, age_bracket: str, division_type: str, league_id: str) -> str:
    payload = f"{sport}:{age_bracket}:{division_type}:{league_id}"
    return hashlib.sha256(payload.encode()).hexdigest()[:12]
