"""Baseline baseball rules from Little League International and USA Baseball."""

BASEBALL_RULES = [
    # ── PITCH COUNT LIMITS ───────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "pitch_count_limits", "subcategory": "daily_max_7_8",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Players ages 7-8 may not pitch more than 50 pitches per day.",
        "plain_language_text": "Ages 7-8: maximum 50 pitches per game day.",
        "scope": {"age_brackets": ["U8"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 50, "numeric_unit": "pitches_per_day",
        "safety_critical": True, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "safety", "pitcher"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "pitch_count_limits", "subcategory": "daily_max_9_10",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Players ages 9-10 may not pitch more than 75 pitches per day.",
        "plain_language_text": "Ages 9-10: maximum 75 pitches per game day.",
        "scope": {"age_brackets": ["U10"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 75, "numeric_unit": "pitches_per_day",
        "safety_critical": True, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "safety", "pitcher"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "pitch_count_limits", "subcategory": "daily_max_11_12",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Players ages 11-12 may not pitch more than 85 pitches per day.",
        "plain_language_text": "Ages 11-12: maximum 85 pitches per game day.",
        "scope": {"age_brackets": ["U12"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 85, "numeric_unit": "pitches_per_day",
        "safety_critical": True, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "safety", "pitcher"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "pitch_count_limits", "subcategory": "daily_max_13_16",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Players ages 13-16 may not pitch more than 95 pitches per day.",
        "plain_language_text": "Ages 13-16: maximum 95 pitches per game day.",
        "scope": {"age_brackets": ["U14", "U16"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 95, "numeric_unit": "pitches_per_day",
        "safety_critical": True, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "safety", "pitcher"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "pitch_count_limits", "subcategory": "daily_max_17_18",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Players ages 17-18 may not pitch more than 105 pitches per day.",
        "plain_language_text": "Ages 17-18: maximum 105 pitches per game day.",
        "scope": {"age_brackets": ["U18", "high_school"], "division_types": ["all"], "league_levels": ["all"]},
        "numeric_value": 105, "numeric_unit": "pitches_per_day",
        "safety_critical": True, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "safety", "pitcher"],
        "normative_certainty": 0.99,
    },

    # ── MANDATORY REST DAYS ──────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "mandatory_rest_days", "subcategory": "rest_tier_1_2",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Rest requirements by pitch count: 1-20 pitches = 0 rest days; 21-35 pitches = 1 calendar day rest; 36-50 pitches = 2 calendar days rest. These minimums apply to ages 7-8. A player who pitches on two consecutive days must rest the following day regardless of pitch counts.",
        "plain_language_text": "Ages 7-8: 1-20 pitches → no rest needed. 21-35 pitches → 1 day rest. 36-50 pitches → 2 days rest.",
        "scope": {"age_brackets": ["U8"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 2,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "rest_days", "safety"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "mandatory_rest_days", "subcategory": "rest_tier_9_10",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Ages 9-10 rest requirements: 1-20 pitches = 0 days; 21-35 pitches = 1 day; 36-50 pitches = 2 days; 51-65 pitches = 3 days; 66+ pitches = 4 days.",
        "plain_language_text": "Ages 9-10: 1-20=0 days, 21-35=1 day, 36-50=2 days, 51-65=3 days, 66+=4 days.",
        "scope": {"age_brackets": ["U10"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 2,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "rest_days", "safety"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "mandatory_rest_days", "subcategory": "rest_tier_11_12",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Ages 11-12 rest requirements: 1-20 pitches = 0 days; 21-35 pitches = 1 day; 36-50 pitches = 2 days; 51-65 pitches = 3 days; 66+ pitches = 4 days.",
        "plain_language_text": "Ages 11-12: 1-20=0 days, 21-35=1 day, 36-50=2 days, 51-65=3 days, 66+=4 days.",
        "scope": {"age_brackets": ["U12"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 2,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "rest_days", "safety"],
        "normative_certainty": 0.99,
    },
    {
        "sport": "baseball", "category": "mandatory_rest_days", "subcategory": "rest_tier_13_16",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Ages 13-16 rest requirements: 1-20 pitches = 0 days; 21-35 pitches = 1 day; 36-50 pitches = 2 days; 51-65 pitches = 3 days; 66+ pitches = 4 days.",
        "plain_language_text": "Ages 13-16: 1-20=0 days, 21-35=1 day, 36-50=2 days, 51-65=3 days, 66+=4 days.",
        "scope": {"age_brackets": ["U14", "U16"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 2,
        "governing_body_source": "Little_League_International", "tags": ["pitch_count", "rest_days", "safety"],
        "normative_certainty": 0.99,
    },

    # ── BAT CERTIFICATION ────────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "bat_certification", "subcategory": "usa_baseball_standard",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "All bats used in Little League play (ages 7-16) must bear the USA Baseball certification mark. Bats with the BBCOR certification are also permitted for players 14 and older. USSSA-only stamped bats are NOT permitted in Little League play.",
        "plain_language_text": "Little League U14-: bat must have the USA Baseball stamp. USSSA-only bats are banned. Ages 14+: BBCOR bats are also allowed.",
        "scope": {"age_brackets": ["U8", "U10", "U12", "U14", "U16"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 3,
        "governing_body_source": "Little_League_International", "tags": ["equipment", "bat_certification", "USA_Baseball"],
        "normative_certainty": 0.99,
    },

    # ── RUN RULE (MERCY RULE) ────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "run_rule", "subcategory": "mercy_rule",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "The run rule (mercy rule) applies as follows: 15 or more runs after 3 innings; 10 or more runs after 4 innings; 8 or more runs after 5 innings (if local league adopts this standard). Games end immediately once the run differential threshold is reached.",
        "plain_language_text": "Mercy rule: game ends if a team is up 15+ after 3 innings, 10+ after 4 innings, or 8+ after 5 innings.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 4,
        "governing_body_source": "Little_League_International", "tags": ["run_rule", "mercy_rule", "game_format"],
        "normative_certainty": 0.90,
    },

    # ── BASE STEALING ────────────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "base_stealing", "subcategory": "stealing_restrictions",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Base stealing is not permitted for T-Ball or Coach-Pitch divisions. In Kid-Pitch 9-10 year old divisions, base stealing is typically not permitted until the ball reaches the batter (no leadoffs). In Majors (11-12) and above, standard base stealing rules apply: runners may steal on any pitch. Local leagues may restrict stealing at lower levels.",
        "plain_language_text": "T-Ball/Coach-Pitch: no stealing. Ages 9-10: no stealing until ball reaches batter. Ages 11+: normal stealing rules apply.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 5,
        "governing_body_source": "Little_League_International", "tags": ["base_stealing", "baserunning"],
        "normative_certainty": 0.90,
    },

    # ── INNING COUNT ─────────────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "inning_count", "subcategory": "standard_game_length",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Standard Little League games are 6 innings for Minors/Majors. Junior (13-14) and Senior (15-16) divisions play 7-inning games. High school games are 7 innings (NFHS).",
        "plain_language_text": "Little League Minors/Majors: 6 innings. Junior/Senior: 7 innings. High school: 7 innings.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Little_League_International", "tags": ["game_format", "innings"],
        "normative_certainty": 0.95,
    },

    # ── BATTING ORDER ────────────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "batting_order", "subcategory": "continuous_batting_order",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Many youth leagues at Minors level and below use a continuous batting order where all players on the roster bat regardless of their defensive position. This ensures playing time. Leagues at Majors level and above typically use a standard 9-player batting lineup.",
        "plain_language_text": "Minors and below often require all players to bat (continuous order). Majors+ use standard 9-player batting lineup.",
        "scope": {"age_brackets": ["U8", "U10", "U12"], "division_types": ["recreational"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 6,
        "governing_body_source": "Little_League_International", "tags": ["batting_order", "playing_time"],
        "normative_certainty": 0.80,
    },

    # ── CONCUSSION PROTOCOL ──────────────────────────────────────────────────
    {
        "sport": "baseball", "category": "concussion_protocol", "subcategory": "return_to_play",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Any player suspected of sustaining a concussion must be immediately removed from play and may not return to play the same day. Return to play requires written medical clearance from a licensed healthcare professional.",
        "plain_language_text": "Suspected concussion = out for the day. Needs a doctor's written clearance to return.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 5,
        "governing_body_source": "CDC_HeadsUp", "tags": ["concussion", "safety"],
        "normative_certainty": 0.99,
    },
]
