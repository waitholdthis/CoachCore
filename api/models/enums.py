import enum


class Sport(str, enum.Enum):
    soccer = "soccer"
    baseball = "baseball"
    basketball = "basketball"
    football = "football"


class AgeBracket(str, enum.Enum):
    u6 = "U6"
    u8 = "U8"
    u10 = "U10"
    u11 = "U11"
    u12 = "U12"
    u14 = "U14"
    u16 = "U16"
    u18 = "U18"
    high_school = "high_school"
    all_ages = "all"


class DivisionType(str, enum.Enum):
    recreational = "recreational"
    competitive = "competitive"
    travel = "travel"
    aau = "AAU"
    t_ball = "t_ball"
    coach_pitch = "coach_pitch"
    kid_pitch = "kid_pitch"
    flag = "flag"
    tackle = "tackle"
    all_divisions = "all"


class RuleTier(str, enum.Enum):
    baseline = "baseline"
    governing_body = "governing_body"
    local = "local"
    tournament = "tournament"


class ConflictType(str, enum.Enum):
    override = "OVERRIDE"
    restrict = "RESTRICT"
    expand = "EXPAND"
    supplement = "SUPPLEMENT"
    conflict = "CONFLICT"


class ConflictResolution(str, enum.Enum):
    local_overrides = "LOCAL_OVERRIDES"
    baseline_applies = "BASELINE_APPLIES"
    pending_review = "PENDING_REVIEW"


class IngestionStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    partial = "partial"


class RuleType(str, enum.Enum):
    boolean = "boolean"
    numeric = "numeric"
    enumerated = "enumerated"
    prose = "prose"


SAFETY_CRITICAL_CATEGORIES: dict[Sport, list[str]] = {
    Sport.baseball: ["pitch_count_limits", "mandatory_rest_days", "concussion_protocol"],
    Sport.football: ["weight_limits", "concussion_protocol", "mandatory_play_minimums", "illegal_contact"],
    Sport.soccer: ["concussion_protocol", "heading_restrictions"],
    Sport.basketball: ["concussion_protocol"],
}

GAME_DAY_CRITICAL_CATEGORIES: dict[Sport, list[str]] = {
    Sport.soccer: ["game_duration", "ball_size", "player_minimum", "substitution_policy"],
    Sport.baseball: ["inning_count", "pitch_count_limits", "run_rule", "batting_order"],
    Sport.basketball: ["period_length", "clock_format", "timeouts", "foul_limits"],
    Sport.football: ["quarter_length", "kickoff_rules", "mandatory_play_minimums", "weight_limits"],
}
