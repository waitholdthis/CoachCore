"""
Query rewriter: expands a natural language question into a structured retrieval query.
Uses Claude Haiku for speed.
"""
from __future__ import annotations
import json
from anthropic import AsyncAnthropic
from schemas.chat import ChatQuery
from config import get_settings

settings = get_settings()
_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


_REWRITE_PROMPT = """You are a sports rules query analyst.

Given this question from a youth sports coach or parent, extract structured search parameters.

QUESTION: {question}

Available sports: soccer, baseball, basketball, football
Available age brackets: U6, U8, U10, U11, U12, U14, U16, U18, high_school

CONTEXT PROVIDED:
- Sport: {sport}
- Age bracket: {age_bracket}
- Division type: {division_type}

Extract:
- sport: detect from question if not provided (null if unclear)
- age_bracket: detect from question if not provided (null if unclear)
- division_type: detect (null if unclear)
- rule_categories: array of the most relevant rule categories to search (1-3 categories)
  Possible categories: game_duration, ball_size, heading_restrictions, slide_tackle_rules,
  build_out_line, substitution_policy, goalkeeper_rules, player_minimum, offside_modifications,
  pitch_count_limits, mandatory_rest_days, bat_certification, run_rule, base_stealing,
  inning_count, batting_order, zone_defense_restrictions, press_defense_restrictions,
  clock_format, free_throw_line_distance, timeouts, foul_limits, three_point_line_distance,
  weight_limits, kickoff_rules, punt_rules, mandatory_play_minimums, lineman_restrictions,
  blitz_restrictions, illegal_contact, concussion_protocol
- search_keywords: 2-4 key terms for BM25 search
- safety_relevant: true if question is about player safety

Return ONLY valid JSON. No explanation.
{{"sport": "...", "age_bracket": "...", "division_type": "...", "rule_categories": [], "search_keywords": [], "safety_relevant": false}}"""


async def rewrite_query(query: ChatQuery) -> dict:
    """Expand a user query into structured retrieval parameters."""
    prompt = _REWRITE_PROMPT.format(
        question=query.question,
        sport=query.sport or "not specified",
        age_bracket=query.age_bracket or "not specified",
        division_type=query.division_type or "not specified",
    )

    response = await get_client().messages.create(
        model=settings.llm_fast_model,
        max_tokens=256,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    try:
        params = json.loads(raw)
    except json.JSONDecodeError:
        params = {}

    # Merge with explicitly provided context (explicit always wins)
    if query.sport:
        params["sport"] = query.sport
    if query.age_bracket:
        params["age_bracket"] = query.age_bracket
    if query.division_type:
        params["division_type"] = query.division_type

    return params
