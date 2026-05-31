"""
Semantic chunker: extracts Rule Atoms from raw page text using Claude.
Each Rule Atom is a single enforceable regulation with structured qualifiers.
"""
from __future__ import annotations
import json
from dataclasses import dataclass, field
from anthropic import AsyncAnthropic
from config import get_settings

settings = get_settings()
_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


@dataclass
class RuleAtom:
    canonical_text: str
    plain_language_text: str
    category: str
    subcategory: str | None
    rule_type: str  # boolean | numeric | prose | enumerated
    age_brackets: list[str]
    division_types: list[str]
    safety_critical: bool
    normative_certainty: float  # 0.0–1.0
    numeric_value: float | None = None
    numeric_unit: str | None = None
    temporal_qualifier: str | None = None
    source_page: int = 0
    source_paragraph: str | None = None
    tags: list[str] = field(default_factory=list)


_EXTRACTION_PROMPT = """You are a sports rules extraction specialist. Extract every enforceable rule from the text below into a structured JSON array.

Sport context: {sport}
Age bracket context: {age_bracket}
Document page: {page_number}

TEXT:
{text}

For each rule atom found, output an object with these fields:
- canonical_text: the exact regulatory statement (what the rule IS)
- plain_language_text: a clear, simple explanation for a parent with no sports background
- category: one of [game_duration, ball_size, heading_restrictions, slide_tackle_rules, build_out_line, substitution_policy, goalkeeper_rules, player_minimum, offside_modifications, pitch_count_limits, mandatory_rest_days, bat_certification, run_rule, base_stealing, inning_count, batting_order, zone_defense_restrictions, press_defense_restrictions, clock_format, free_throw_line_distance, timeouts, foul_limits, three_point_line_distance, weight_limits, kickoff_rules, punt_rules, mandatory_play_minimums, lineman_restrictions, blitz_restrictions, illegal_contact, concussion_protocol, other]
- subcategory: a specific label (snake_case)
- rule_type: "boolean" | "numeric" | "prose" | "enumerated"
- age_brackets: array of applicable age brackets from ["U6","U8","U10","U11","U12","U14","U16","U18","high_school","all"]
- division_types: array from ["recreational","competitive","travel","AAU","t_ball","coach_pitch","kid_pitch","flag","tackle","all"]
- safety_critical: true if this rule protects player safety (concussions, pitch counts, weight limits, banned techniques)
- normative_certainty: 0.0-1.0 — how mandatory is this? (1.0="must/shall/prohibited", 0.5="should/recommended", 0.2="generally/may")
- numeric_value: number if the rule contains a specific value (null if not applicable)
- numeric_unit: unit for the number (e.g., "minutes_per_half", "pitches_per_day", "ball_size")
- temporal_qualifier: time-based constraint if present (e.g., "first_half", "first_two_innings") or null
- tags: relevant keyword tags

Return ONLY a valid JSON array. No explanation, no markdown fences.
If no rules are found, return [].
"""


async def extract_rule_atoms(
    text: str,
    sport: str,
    age_bracket: str,
    page_number: int,
) -> list[RuleAtom]:
    """Extract structured rule atoms from a page of text using Claude."""
    if not text or len(text.strip()) < 30:
        return []

    prompt = _EXTRACTION_PROMPT.format(
        sport=sport,
        age_bracket=age_bracket,
        page_number=page_number,
        text=text[:8000],  # cap per page
    )

    response = await get_client().messages.create(
        model=settings.llm_fast_model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip any accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        atoms_data = json.loads(raw)
    except json.JSONDecodeError:
        return []

    atoms: list[RuleAtom] = []
    for item in atoms_data:
        try:
            atom = RuleAtom(
                canonical_text=item.get("canonical_text", ""),
                plain_language_text=item.get("plain_language_text", ""),
                category=item.get("category", "other"),
                subcategory=item.get("subcategory"),
                rule_type=item.get("rule_type", "prose"),
                age_brackets=item.get("age_brackets", ["all"]),
                division_types=item.get("division_types", ["all"]),
                safety_critical=item.get("safety_critical", False),
                normative_certainty=float(item.get("normative_certainty", 0.7)),
                numeric_value=item.get("numeric_value"),
                numeric_unit=item.get("numeric_unit"),
                temporal_qualifier=item.get("temporal_qualifier"),
                source_page=page_number,
                tags=item.get("tags", []),
            )
            if atom.canonical_text:
                atoms.append(atom)
        except (KeyError, TypeError, ValueError):
            continue

    return atoms


async def chunk_document(
    pages: list[tuple[int, str]],  # [(page_num, text), ...]
    sport: str,
    age_bracket: str,
) -> list[RuleAtom]:
    """Process all pages of a document and return all extracted rule atoms."""
    all_atoms: list[RuleAtom] = []
    for page_num, page_text in pages:
        atoms = await extract_rule_atoms(page_text, sport, age_bracket, page_num)
        all_atoms.extend(atoms)
    return all_atoms
