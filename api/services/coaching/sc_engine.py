import json
import anthropic
from config import get_settings
from services.coaching.ltad import get_ltad_stage, get_sport_specific_constraints


def build_sc_generation_prompt(
    sport: str,
    age_bracket: str,
    season_phase: str,
    weeks: int,
    days_per_week: int,
    goals: str | None,
) -> str | None:
    stage = get_ltad_stage(age_bracket)

    # Hard gates by stage
    if stage.stage_name == "Active Start":
        return None  # No formal program for U6

    constraints_text = "\n".join(f"- {p}" for p in stage.prohibited) if stage.prohibited else "- No absolute prohibitions — maintain age-appropriate load management"

    phase_focus = {
        "off_season": "General fitness, address weaknesses, higher volume",
        "pre_season": "Sport-specific conditioning, power development, ramping intensity",
        "in_season": "Maintenance, reduce volume 30-40%, prioritize recovery",
        "post_season": "Active recovery, mobility, address injuries, mental break",
    }.get(season_phase, "General fitness development")

    return f"""You are a certified Strength & Conditioning Specialist (CSCS) expert in youth athletic development.
Generate a complete {weeks}-week S&C macrocycle. Return ONLY valid JSON — no markdown, no explanation.

PROGRAM PARAMETERS:
- Sport: {sport}
- Age Group: {age_bracket}
- LTAD Stage: {stage.stage_name}
- Season Phase: {season_phase} — {phase_focus}
- Program Length: {weeks} weeks
- Training Days per Week: {days_per_week}
- Athlete Goals: {goals or "General athletic development"}
- S&C Guidelines for this stage: {stage.sc_guidelines}

ABSOLUTE SAFETY PROHIBITIONS:
{constraints_text}

RETURN THIS EXACT JSON STRUCTURE:
{{
  "title": "program title",
  "overview": "3-4 sentence program philosophy and approach",
  "ltad_stage": "{stage.stage_name}",
  "safety_constraints": ["list every constraint applied"],
  "warm_up_protocol": {{
    "description": "standard warm-up for all sessions",
    "duration_minutes": integer,
    "components": ["component 1", "component 2"]
  }},
  "weeks": [
    {{
      "week_number": 1,
      "theme": "week theme e.g. Anatomical Adaptation / Introduction",
      "overall_volume": "low|medium|high",
      "overall_intensity": "low|medium|high",
      "sessions": [
        {{
          "day": "Day 1",
          "focus": "session focus",
          "duration_minutes": integer,
          "blocks": [
            {{
              "name": "block name e.g. Power Complex",
              "exercises": [
                {{
                  "name": "exercise name",
                  "sets": integer or null,
                  "reps": "e.g. 8-10 or 30sec",
                  "load": "e.g. bodyweight | light DB | 60% 1RM | RPE 6",
                  "rest_seconds": integer,
                  "coaching_cue": "one key coaching point",
                  "regression": "easier variation",
                  "progression": "harder variation"
                }}
              ]
            }}
          ]
        }}
      ]
    }}
  ]
}}

Generate all {weeks} weeks. Each week should show progressive overload appropriately for the phase. Ensure every exercise is age-appropriate per the LTAD guidelines."""


async def generate_sc_program(
    sport: str,
    age_bracket: str,
    season_phase: str,
    weeks: int,
    days_per_week: int,
    goals: str | None = None,
) -> dict:
    settings = get_settings()

    stage = get_ltad_stage(age_bracket)
    if stage.stage_name == "Active Start":
        return {
            "title": "Active Start Program",
            "overview": "No formal S&C program is appropriate for the Active Start stage. Encourage unstructured free play for at least 60 minutes daily.",
            "ltad_stage": "Active Start",
            "safety_constraints": ["No formal training appropriate at this age"],
            "warm_up_protocol": {"description": "Free play", "duration_minutes": 60, "components": ["Unstructured movement"]},
            "weeks": [],
        }

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    prompt = build_sc_generation_prompt(sport, age_bracket, season_phase, weeks, days_per_week, goals)

    message = await client.messages.create(
        model=settings.llm_fast_model,
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0] if "```" in raw else raw

    return json.loads(raw)
