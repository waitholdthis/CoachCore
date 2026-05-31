"""Baseline basketball rules from NFHS, AAU, and youth development guidelines."""

BASKETBALL_RULES = [
    # ── PERIOD LENGTH ────────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "period_length", "subcategory": "quarter_length",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "U8 and below play four 6-minute quarters.",
        "plain_language_text": "U8: 4 quarters × 6 minutes = 24 minutes total.",
        "scope": {"age_brackets": ["U6", "U8"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 6, "numeric_unit": "minutes_per_quarter",
        "safety_critical": False, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "local_standard", "tags": ["game_duration", "periods"],
    },
    {
        "sport": "basketball", "category": "period_length", "subcategory": "quarter_length",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "U10 and U12 divisions play four 8-minute quarters.",
        "plain_language_text": "U10/U12: 4 quarters × 8 minutes = 32 minutes total.",
        "scope": {"age_brackets": ["U10", "U12"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 8, "numeric_unit": "minutes_per_quarter",
        "safety_critical": False, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "local_standard", "tags": ["game_duration", "periods"],
    },
    {
        "sport": "basketball", "category": "period_length", "subcategory": "quarter_length",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "U14 divisions play four 8-minute quarters. Competitive travel leagues may play four 10-minute quarters.",
        "plain_language_text": "U14: 4 quarters × 8-10 minutes.",
        "scope": {"age_brackets": ["U14"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 8, "numeric_unit": "minutes_per_quarter",
        "safety_critical": False, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "local_standard", "tags": ["game_duration", "periods"],
    },
    {
        "sport": "basketball", "category": "period_length", "subcategory": "quarter_length_hs",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "High school games per NFHS consist of four 8-minute quarters.",
        "plain_language_text": "High school: 4 quarters × 8 minutes (NFHS standard).",
        "scope": {"age_brackets": ["high_school"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 8, "numeric_unit": "minutes_per_quarter",
        "safety_critical": False, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "NFHS", "tags": ["game_duration", "periods"],
    },

    # ── CLOCK FORMAT ─────────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "clock_format", "subcategory": "running_clock",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Recreational leagues for U10 and below typically use a running clock that only stops for timeouts and injuries. Recreational U12 may also use a running clock.",
        "plain_language_text": "Rec U10 and below: clock keeps running (only stops for TOs and injuries). This makes games shorter and more predictable.",
        "scope": {"age_brackets": ["U6", "U8", "U10"], "division_types": ["recreational"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 2,
        "governing_body_source": "local_standard", "tags": ["clock", "game_format"],
        "normative_certainty": 0.80,
    },
    {
        "sport": "basketball", "category": "clock_format", "subcategory": "stopped_clock",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Competitive and travel divisions and all recreational divisions U12 and above use a stopped clock: the clock stops on all dead balls, fouls, and out-of-bounds calls.",
        "plain_language_text": "Competitive leagues and rec U12+: clock stops on all fouls, dead balls, and out-of-bounds.",
        "scope": {"age_brackets": ["U12", "U14", "U16", "U18", "high_school"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 2,
        "governing_body_source": "NFHS", "tags": ["clock", "game_format"],
        "normative_certainty": 0.85,
    },

    # ── ZONE DEFENSE RESTRICTIONS ────────────────────────────────────────────
    {
        "sport": "basketball", "category": "zone_defense_restrictions", "subcategory": "zone_ban_u10",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Zone defense is prohibited for all players U10 and under in recreational divisions. All defensive schemes must be man-to-man. Violation results in a technical foul.",
        "plain_language_text": "Rec U10 and below: zone defense is BANNED. All defense must be man-to-man. Breaking this rule = technical foul.",
        "scope": {"age_brackets": ["U6", "U8", "U10"], "division_types": ["recreational"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 3,
        "governing_body_source": "local_standard", "tags": ["defense", "zone_defense"],
        "normative_certainty": 0.90,
    },
    {
        "sport": "basketball", "category": "zone_defense_restrictions", "subcategory": "zone_allowed_u12_plus",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Zone defense is permitted for all divisions U12 and above at the coach's discretion.",
        "plain_language_text": "U12 and older: coaches can choose to run zone defense.",
        "scope": {"age_brackets": ["U12", "U14", "U16", "U18", "high_school"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": False, "display_priority": 30,
        "governing_body_source": "NFHS", "tags": ["defense", "zone_defense"],
        "normative_certainty": 0.95,
    },

    # ── PRESS DEFENSE RESTRICTIONS ───────────────────────────────────────────
    {
        "sport": "basketball", "category": "press_defense_restrictions", "subcategory": "press_ban_u10",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Full-court press defense is prohibited in all recreational divisions for players U10 and under. Defense must remain in the offensive half-court (backcourt) until the ball crosses half-court.",
        "plain_language_text": "Rec U10 and below: no full-court press. Defense must stay in their half until the ball crosses halfcourt.",
        "scope": {"age_brackets": ["U6", "U8", "U10"], "division_types": ["recreational"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 4,
        "governing_body_source": "local_standard", "tags": ["defense", "press_defense"],
        "normative_certainty": 0.90,
    },
    {
        "sport": "basketball", "category": "press_defense_restrictions", "subcategory": "press_allowed_u12_plus",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Full-court press defense is permitted for U12 and above.",
        "plain_language_text": "U12+ can run a full-court press.",
        "scope": {"age_brackets": ["U12", "U14", "U16", "U18", "high_school"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": False, "display_priority": 30,
        "governing_body_source": "NFHS", "tags": ["defense", "press_defense"],
        "normative_certainty": 0.95,
    },

    # ── BALL SIZE ────────────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "ball_size", "subcategory": "junior_ball",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "U8 and below use a junior size basketball (size 4, 25.5-inch circumference).",
        "plain_language_text": "U8 and younger use a Size 4 junior basketball (25.5\").",
        "scope": {"age_brackets": ["U6", "U8"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 25.5, "numeric_unit": "inches_circumference",
        "safety_critical": False, "game_day_critical": True, "display_priority": 5,
        "governing_body_source": "local_standard", "tags": ["equipment", "ball_size"],
    },
    {
        "sport": "basketball", "category": "ball_size", "subcategory": "intermediate_ball",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "U10 through U12 boys and all girls U12 and above use an intermediate basketball (size 6, 28.5-inch circumference).",
        "plain_language_text": "U10-U12 boys and all girls U12+: Size 6 ball (28.5\").",
        "scope": {"age_brackets": ["U10", "U12"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 28.5, "numeric_unit": "inches_circumference",
        "safety_critical": False, "game_day_critical": True, "display_priority": 5,
        "governing_body_source": "local_standard", "tags": ["equipment", "ball_size"],
    },
    {
        "sport": "basketball", "category": "ball_size", "subcategory": "official_ball",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Boys U14 and above use an official men's basketball (size 7, 29.5-inch circumference).",
        "plain_language_text": "Boys U14+: full-size official basketball (29.5\").",
        "scope": {"age_brackets": ["U14", "U16", "U18", "high_school"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 29.5, "numeric_unit": "inches_circumference",
        "safety_critical": False, "game_day_critical": True, "display_priority": 5,
        "governing_body_source": "NFHS", "tags": ["equipment", "ball_size"],
    },

    # ── FREE THROW LINE ──────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "free_throw_line_distance", "subcategory": "shortened_ft_line",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "For U8 and U10 divisions, the free-throw line may be shortened to 12 feet from the basket (versus the standard 15 feet) to allow successful shooting.",
        "plain_language_text": "U8/U10: free throw line is often moved up to 12 feet instead of 15 feet.",
        "scope": {"age_brackets": ["U6", "U8", "U10"], "division_types": ["recreational"], "league_levels": ["all"]},
        "numeric_value": 12, "numeric_unit": "feet_from_basket",
        "safety_critical": False, "game_day_critical": False, "display_priority": 20,
        "governing_body_source": "local_standard", "tags": ["free_throw", "court_dimensions"],
        "normative_certainty": 0.75,
    },

    # ── TIMEOUTS ─────────────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "timeouts", "subcategory": "timeout_count",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Each team is entitled to 2 timeouts per half in recreational leagues (4 total). Competitive leagues follow NFHS standard: 5 timeouts per game, of which no more than 3 may be full timeouts in the second half.",
        "plain_language_text": "Rec: 2 timeouts per half (4 total). Competitive: 5 per game (NFHS).",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 4, "numeric_unit": "timeouts_per_game",
        "safety_critical": False, "game_day_critical": True, "display_priority": 6,
        "governing_body_source": "NFHS", "tags": ["timeouts", "game_format"],
        "normative_certainty": 0.85,
    },

    # ── FOUL LIMITS ──────────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "foul_limits", "subcategory": "personal_foul_limit",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Players in recreational youth leagues foul out after 5 personal fouls. High school follows NFHS: players foul out after 5 personal fouls. Team foul bonus (one-and-one) applies after the 7th team foul per half; double bonus after the 10th.",
        "plain_language_text": "5 personal fouls = player fouls out. Team bonus free throws start after the 7th team foul per half.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 5, "numeric_unit": "fouls_per_player",
        "safety_critical": False, "game_day_critical": True, "display_priority": 7,
        "governing_body_source": "NFHS", "tags": ["fouls", "game_format"],
        "normative_certainty": 0.95,
    },

    # ── 3-POINT LINE ─────────────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "three_point_line_distance", "subcategory": "no_three_point_u10",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "The 3-point line is not used in recreational divisions for U10 and below. All successful field goals count as 2 points.",
        "plain_language_text": "Rec U10 and below: no 3-point line. All baskets are worth 2 points.",
        "scope": {"age_brackets": ["U6", "U8", "U10"], "division_types": ["recreational"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": False, "display_priority": 25,
        "governing_body_source": "local_standard", "tags": ["three_point_line", "scoring"],
        "normative_certainty": 0.88,
    },

    # ── CONCUSSION PROTOCOL ──────────────────────────────────────────────────
    {
        "sport": "basketball", "category": "concussion_protocol", "subcategory": "return_to_play",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Any player suspected of sustaining a concussion must be immediately removed from play and may not return to play the same day. Return to play requires written medical clearance from a licensed healthcare professional.",
        "plain_language_text": "Suspected concussion = out for the day, needs doctor clearance to return.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 5,
        "governing_body_source": "CDC_HeadsUp", "tags": ["concussion", "safety"],
        "normative_certainty": 0.99,
    },
]
