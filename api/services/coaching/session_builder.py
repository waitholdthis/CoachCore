import json
import anthropic
from config import get_settings
from services.coaching.ltad import get_ltad_stage, get_sport_specific_constraints, SPORT_PRACTICE_PHASES


def build_session_generation_prompt(
    sport: str,
    age_bracket: str,
    focus_area: str,
    duration_minutes: int,
    division_type: str | None,
    additional_context: str | None,
    rule_constraints: list[str],
) -> str:
    stage = get_ltad_stage(age_bracket)
    sport_constraints = get_sport_specific_constraints(sport, age_bracket)
    all_constraints = sport_constraints + rule_constraints
    phases = SPORT_PRACTICE_PHASES.get(sport, ["Warm-Up", "Technical", "Tactical", "Cool-Down"])

    constraints_text = "\n".join(f"- {c}" for c in all_constraints) if all_constraints else "- No special restrictions beyond age-appropriate guidelines"
    phases_hint = ", ".join(phases)

    return f"""You are a certified youth sports coach and Long-Term Athletic Development (LTAD) specialist.
Generate a complete, detailed practice session plan. Return ONLY valid JSON — no markdown, no explanation.

SESSION PARAMETERS:
- Sport: {sport}
- Age Group: {age_bracket}
- LTAD Stage: {stage.stage_name} — {stage.focus}
- Focus Area: {focus_area}
- Total Duration: {duration_minutes} minutes
- Division: {division_type or "recreational"}
- Additional Coach Notes: {additional_context or "None"}

LTAD INTENSITY CEILING: {stage.intensity_ceiling} (never exceed this for this age group)
LTAD KEY COMPONENTS TO DEVELOP: {", ".join(stage.key_components)}

MANDATORY SAFETY & RULE CONSTRAINTS (non-negotiable):
{constraints_text}

Generate phases in this order: {phases_hint}
Allocate time proportionally: Warm-Up ~12%, Technical ~25%, Tactical/Game ~50%, Cool-Down ~13%.

RETURN THIS EXACT JSON STRUCTURE:
{{
  "title": "descriptive session title",
  "overview": "2-3 sentence coaching rationale explaining pedagogical approach",
  "phases": [
    {{
      "name": "phase name",
      "duration_minutes": integer,
      "color": "one of: amber, blue, green, purple, slate",
      "activities": [
        {{
          "name": "activity name",
          "duration_minutes": integer,
          "description": "clear, actionable description for a coach reading this on a sideline",
          "setup": "field/court setup description",
          "coaching_points": ["point 1", "point 2", "point 3"],
          "progressions": ["easier variation", "harder variation"],
          "equipment": ["list of equipment needed"],
          "intensity": "low|medium|high",
          "ltad_component": "which LTAD component this develops",
          "player_count": "e.g. pairs, groups of 4, full team"
        }}
      ]
    }}
  ],
  "equipment_list": ["complete deduplicated list of all equipment needed"],
  "safety_notes": ["any age-specific safety reminders"],
  "coaching_cues": ["3-5 key phrases coaches should repeat throughout the session"],
  "total_players_needed": integer or null
}}

Generate rich, specific content. Each activity must be immediately usable by a real coach. Minimum 2 activities per phase."""


async def generate_practice_plan(
    sport: str,
    age_bracket: str,
    focus_area: str,
    duration_minutes: int,
    division_type: str | None = None,
    additional_context: str | None = None,
    rule_constraints: list[str] | None = None,
) -> dict:
    """Calls Claude claude-sonnet-4-6 to generate a structured practice plan. Returns parsed dict."""
    settings = get_settings()
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    prompt = build_session_generation_prompt(
        sport, age_bracket, focus_area, duration_minutes,
        division_type, additional_context, rule_constraints or []
    )

    message = await client.messages.create(
        model=settings.llm_model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0] if "```" in raw else raw

    return json.loads(raw)
