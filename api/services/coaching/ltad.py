from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class LTADStage:
    stage_name: str
    age_brackets: List[str]
    focus: str
    key_components: List[str]
    prohibited: List[str]
    sc_guidelines: str
    max_session_minutes: int
    max_sessions_per_week: int
    intensity_ceiling: str  # "low", "medium", "high"
    notes: str


LTAD_DATA: Dict[str, LTADStage] = {
    "U6": LTADStage(
        stage_name="Active Start",
        age_brackets=["U6"],
        focus="Unstructured play, basic movement patterns, joy of movement",
        key_components=["balance", "coordination", "agility", "run", "jump", "throw", "catch"],
        prohibited=["structured drills", "formal training", "competition pressure", "early specialization"],
        sc_guidelines="Unstructured free play only. No formal S&C program appropriate at this stage.",
        max_session_minutes=45,
        max_sessions_per_week=3,
        intensity_ceiling="low",
        notes="Focus entirely on fun and exploration. ABCs = Athleticism, Balance, Coordination.",
    ),
    "U8": LTADStage(
        stage_name="FUNdamentals",
        age_brackets=["U8"],
        focus="ABCs of athleticism: Agility, Balance, Coordination, Speed through play",
        key_components=["agility", "balance", "coordination", "speed", "object_control", "spatial_awareness"],
        prohibited=["heavy resistance", "early specialization", "periodized training", "competition-focused training"],
        sc_guidelines="Bodyweight only. Games that develop locomotion and object control. Medicine balls NOT appropriate.",
        max_session_minutes=60,
        max_sessions_per_week=4,
        intensity_ceiling="medium",
        notes="Golden age for speed development. Keep it game-based. Multi-sport participation strongly encouraged.",
    ),
    "U10": LTADStage(
        stage_name="FUNdamentals / Learn to Train",
        age_brackets=["U10"],
        focus="Fundamental movement skills, beginning sport-specific skill acquisition",
        key_components=["fundamental_movement", "agility", "coordination", "flexibility", "beginning_sport_skills"],
        prohibited=["barbell loading", "maximal effort", "single sport only", "adult periodization models"],
        sc_guidelines="Bodyweight circuits (push/pull/squat/hinge fundamentals). Resistance bands. Medicine balls ≤2kg. Max 2 dedicated S&C sessions/week. No training to failure.",
        max_session_minutes=75,
        max_sessions_per_week=4,
        intensity_ceiling="medium",
        notes="Perfect timing for technical skill acquisition. Begin introducing sport-specific movements with perfect form.",
    ),
    "U12": LTADStage(
        stage_name="Learn to Train",
        age_brackets=["U12"],
        focus="Sport skill mastery, aerobic base development — the 'Golden Age of Motor Learning'",
        key_components=["technical_skills", "aerobic_base", "flexibility", "plyometric_fundamentals", "bodyweight_strength"],
        prohibited=["barbell squats", "deadlifts", "Olympic lifts", "maximal strength testing", "training to failure"],
        sc_guidelines="Bodyweight mastery (push-up progressions, pull-up progressions, squat/lunge/hinge patterns). Resistance bands, DBs ≤10kg. Plyometric fundamentals (box step-ups, broad jumps, low hurdles). RPE max 7/10. Core stability emphasis.",
        max_session_minutes=90,
        max_sessions_per_week=5,
        intensity_ceiling="high",
        notes="Aerobic trainability window open. Up to 50% of session can be aerobic development. Best time to build technical foundations permanently.",
    ),
    "U14": LTADStage(
        stage_name="Learn to Train / Train to Train",
        age_brackets=["U14"],
        focus="Building the athletic engine — aerobic capacity, strength foundation, power introduction",
        key_components=["aerobic_capacity", "strength_foundation", "power", "sport_specific_skills", "tactical_awareness"],
        prohibited=["near-failure barbell work", "maximal 1RM testing", "specialization in one position only"],
        sc_guidelines="Introduce barbell with technique-only focus (goblet squat → front squat, Romanian DL, push press with light loads). Plyometrics 3x/week (depth drops, bounding, medicine ball throws). Begin structured periodization. RPE max 8/10. Aerobic base 2x/week minimum.",
        max_session_minutes=105,
        max_sessions_per_week=5,
        intensity_ceiling="high",
        notes="PHV (Peak Height Velocity) window — watch for growth plate sensitivity. Reduce load during rapid growth spurts.",
    ),
    "high_school": LTADStage(
        stage_name="Train to Train / Train to Compete",
        age_brackets=["high_school"],
        focus="Developing performance capacity, sport-specific fitness, competitive preparation",
        key_components=["max_strength", "power", "speed", "anaerobic_capacity", "aerobic_capacity", "tactical_mastery"],
        prohibited=[],
        sc_guidelines="Full periodized programs. Macrocycles: Anatomical Adaptation (4-6wk) → Strength (4-6wk) → Power (3-4wk) → Competition (in-season maintenance). Olympic lifts with qualified coaching. Max strength testing appropriate. Block periodization for advanced athletes.",
        max_session_minutes=120,
        max_sessions_per_week=6,
        intensity_ceiling="high",
        notes="Individual variation significant. Monitor training load, sleep, stress. Sport-specific energy system training. Begin position/role specialization.",
    ),
}


def get_ltad_stage(age_bracket: str) -> LTADStage:
    """Returns the LTAD stage for a given age bracket. Falls back to U14 for unknown brackets."""
    bracket_map = {
        "U6": "U6", "U8": "U8", "U10": "U10", "U12": "U12",
        "U14": "U14", "high_school": "high_school",
        "U16": "high_school", "U18": "high_school",
    }
    key = bracket_map.get(age_bracket, "U14")
    return LTAD_DATA[key]


def get_sport_specific_constraints(sport: str, age_bracket: str) -> List[str]:
    """Returns sport+age specific safety constraints for practice design."""
    constraints = []
    stage = get_ltad_stage(age_bracket)

    # Universal age constraints
    if age_bracket in ("U6", "U8"):
        constraints.append("No competitive drills — keep all activities game-based and fun")
        constraints.append("No structured fitness testing")

    # Sport-specific
    if sport == "soccer":
        if age_bracket in ("U6", "U8", "U10"):
            constraints.append("NO heading — heading ban in effect for this age group")
        if age_bracket in ("U6", "U8"):
            constraints.append("No slide tackles in training")
        if age_bracket in ("U6", "U8", "U10"):
            constraints.append("Use build-out line rules in any game activities")

    elif sport == "baseball":
        pitch_limits = {"U8": 50, "U10": 75, "U12": 85, "U14": 95, "high_school": 105}
        limit = pitch_limits.get(age_bracket, 75)
        constraints.append(f"Pitch count limit: {limit} pitches maximum per session (rest days required)")
        constraints.append("No breaking balls (curveballs, sliders) for U12 and younger — arm safety")
        if age_bracket in ("U6", "U8"):
            constraints.append("Tee work and coach-pitch only — no player pitching")

    elif sport == "basketball":
        if age_bracket in ("U6", "U8", "U10"):
            constraints.append("No zone defense drills — focus on man-to-man concepts")
        if age_bracket in ("U6", "U8"):
            constraints.append("Modified court and lower hoops where available")

    elif sport == "football":
        contact_map = {"U8": "flag only", "U10": "limited contact", "U12": "limited contact", "U14": "full contact allowed"}
        contact = contact_map.get(age_bracket, "full contact allowed")
        constraints.append(f"Contact level: {contact}")
        if age_bracket in ("U8", "U10"):
            constraints.append("No kickoff in game activities — use scrimmage start")
        constraints.append("Mandatory water breaks every 20 minutes in warm weather")

    # S&C constraints from LTAD
    constraints.extend([f"S&C: {p}" for p in stage.prohibited if p])

    return constraints


SPORT_PRACTICE_PHASES = {
    "soccer": ["Warm-Up", "Technical", "Tactical / Small-Sided", "Cool-Down"],
    "baseball": ["Warm-Up", "Throwing Program", "Hitting / Fielding Stations", "Game Situations", "Cool-Down"],
    "basketball": ["Warm-Up", "Skill Work", "Tactical / 3-on-3 / 5-on-5", "Cool-Down"],
    "football": ["Warm-Up", "Individual Position Skills", "Group / Unit Work", "Team Period", "Cool-Down"],
}
