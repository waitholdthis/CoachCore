"""Baseline football rules from Pop Warner, USA Football, and AYF."""

FOOTBALL_RULES = [
    # ── QUARTER LENGTH ───────────────────────────────────────────────────────
    {
        "sport": "football", "category": "quarter_length", "subcategory": "game_duration",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Pop Warner Tiny-Mite (ages 5-7) and Mitey-Mite (ages 7-9) play eight 8-minute running-clock quarters. Older divisions (Junior Midget 12-14, Midget 13-15) play four 10-minute stopped-clock quarters.",
        "plain_language_text": "Ages 5-9: 8 quarters × 8 min (running clock). Ages 12+: 4 quarters × 10 min (stopped clock).",
        "scope": {"age_brackets": ["all"], "division_types": ["tackle", "competitive"], "league_levels": ["all"]},
        "numeric_value": 10, "numeric_unit": "minutes_per_quarter",
        "safety_critical": False, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Pop_Warner", "tags": ["game_duration", "quarters"],
    },

    # ── WEIGHT LIMITS ────────────────────────────────────────────────────────
    {
        "sport": "football", "category": "weight_limits", "subcategory": "ball_carrier_weight_limit",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Pop Warner imposes a weight limit on eligible ball-carriers in certain tackle divisions to protect lighter, younger players from being tackled by much heavier opponents in vulnerable positions. In Tiny-Mite (5-7) and Mitey-Mite (7-9) divisions, all players are eligible ball-carriers regardless of weight. In Junior Pee Wee and Pee Wee divisions, any player who weighs more than the division's maximum 'skill position weight' must play an interior lineman position and may not carry the ball, catch passes, or rush the passer. The specific weight threshold varies by year and local charter; coaches must verify with their local Pop Warner chapter annually.",
        "plain_language_text": "Pop Warner: heavier players in certain divisions CANNOT carry the ball or play skill positions — linemen only. Exact weight cutoffs vary by division and year. VERIFY with your local chapter.",
        "scope": {"age_brackets": ["U8", "U10", "U12"], "division_types": ["tackle"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": True, "display_priority": 1,
        "governing_body_source": "Pop_Warner", "tags": ["weight_limits", "safety", "eligibility"],
        "normative_certainty": 0.97,
    },

    # ── KICKOFF RULES ────────────────────────────────────────────────────────
    {
        "sport": "football", "category": "kickoff_rules", "subcategory": "kickoff_modification_youth",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "In Pop Warner Tiny-Mite and Mitey-Mite divisions, kickoffs are replaced with a scrimmage play from the kicking team's own 35-yard line. Standard kickoffs begin at the Pee Wee level and above. USA Football's Heads Up program recommends replacing kickoffs with free-kick-from-scrimmage scenarios for all players under age 10 due to high-speed collision risk.",
        "plain_language_text": "Ages 7-9: no real kickoffs — replaced with a scrimmage play. Ages 10+: standard kickoffs apply. USA Football recommends avoiding kickoffs under age 10.",
        "scope": {"age_brackets": ["U8", "U10"], "division_types": ["tackle", "competitive"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": True, "display_priority": 2,
        "governing_body_source": "Pop_Warner", "tags": ["kickoff", "safety"],
        "normative_certainty": 0.95,
    },

    # ── PUNT RULES ───────────────────────────────────────────────────────────
    {
        "sport": "football", "category": "punt_rules", "subcategory": "simulated_punt_younger",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "In Tiny-Mite and Mitey-Mite divisions, punts are not permitted. On fourth down, teams may elect to run a fake punt (scrimmage play). In Pee Wee and above, standard punting rules apply. The receiving team may not rush the punter in Mitey-Mite and Tiny-Mite.",
        "plain_language_text": "Ages 7-9: no punts. On 4th down you either go for it or it's a turnover on downs. Ages 10+: normal punting rules.",
        "scope": {"age_brackets": ["U8", "U10"], "division_types": ["tackle", "competitive"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 3,
        "governing_body_source": "Pop_Warner", "tags": ["punting", "special_teams"],
        "normative_certainty": 0.92,
    },

    # ── MANDATORY PLAY MINIMUMS ──────────────────────────────────────────────
    {
        "sport": "football", "category": "mandatory_play_minimums", "subcategory": "minimum_plays_per_game",
        "rule_tier": "baseline", "rule_type": "numeric",
        "canonical_text": "Pop Warner requires all rostered players to participate in a minimum number of offensive or defensive plays per game. The mandatory play requirement is 10 plays per game for Tiny-Mite, Mitey-Mite, and Junior Pee Wee divisions. Pee Wee and above require 6 plays per game. Failure to provide a player their mandatory plays results in the plays being made up in the following game. Coaches are required to track and submit play counts.",
        "plain_language_text": "Pop Warner: every player MUST play a minimum number of snaps per game. Tiny-Mite/Mitey-Mite/Jr Pee Wee: 10 plays min. Pee Wee+: 6 plays min. Track and enforce this.",
        "scope": {"age_brackets": ["U8", "U10", "U12", "U14"], "division_types": ["tackle", "competitive"], "league_levels": ["all"]},
        "numeric_value": 10, "numeric_unit": "plays_per_game",
        "safety_critical": False, "game_day_critical": True, "display_priority": 4,
        "governing_body_source": "Pop_Warner", "tags": ["playing_time", "mandatory_plays"],
        "normative_certainty": 0.98,
    },

    # ── LINEMAN RESTRICTIONS ─────────────────────────────────────────────────
    {
        "sport": "football", "category": "lineman_restrictions", "subcategory": "interior_lineman_eligibility",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Interior linemen (guards, centers, and tackles) may not advance the ball as a runner or receiver. An interior lineman is eligible to recover a fumble but only in the immediate play area. This restriction applies in all youth tackle divisions Pop Warner Pee Wee and above.",
        "plain_language_text": "Linemen (guards, centers, tackles) CANNOT run with the ball, catch passes, or act as a rusher. They can recover fumbles only.",
        "scope": {"age_brackets": ["U10", "U12", "U14"], "division_types": ["tackle", "competitive"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": False, "display_priority": 20,
        "governing_body_source": "Pop_Warner", "tags": ["eligibility", "lineman"],
        "normative_certainty": 0.95,
    },

    # ── BLITZ RESTRICTIONS ───────────────────────────────────────────────────
    {
        "sport": "football", "category": "blitz_restrictions", "subcategory": "no_blitz_younger",
        "rule_tier": "baseline", "rule_type": "boolean",
        "canonical_text": "Linebackers and defensive backs are not permitted to blitz (rush the passer) in Tiny-Mite and Mitey-Mite divisions. Only the four down linemen may rush the passer.",
        "plain_language_text": "Ages 5-9: only the four defensive linemen can rush the passer. No linebacker or secondary blitzing.",
        "scope": {"age_brackets": ["U8"], "division_types": ["tackle"], "league_levels": ["all"]},
        "safety_critical": False, "game_day_critical": True, "display_priority": 5,
        "governing_body_source": "Pop_Warner", "tags": ["defense", "blitz"],
        "normative_certainty": 0.90,
    },

    # ── CONCUSSION PROTOCOL ──────────────────────────────────────────────────
    {
        "sport": "football", "category": "concussion_protocol", "subcategory": "return_to_play",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "Any player suspected of sustaining a concussion must be immediately removed from play and may not return to play the same day. Return to play requires written medical clearance from a licensed healthcare professional. Pop Warner mandates a graduated return-to-play protocol of at least 5 days before full-contact participation.",
        "plain_language_text": "Suspected concussion = out immediately, cannot return same day. Pop Warner: minimum 5-day graduated protocol before full contact. Doctor must clear in writing.",
        "scope": {"age_brackets": ["all"], "division_types": ["all"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 5,
        "governing_body_source": "Pop_Warner", "tags": ["concussion", "safety", "return_to_play"],
        "normative_certainty": 0.99,
    },

    # ── ILLEGAL CONTACT ──────────────────────────────────────────────────────
    {
        "sport": "football", "category": "illegal_contact", "subcategory": "blocking_rules_youth",
        "rule_tier": "baseline", "rule_type": "prose",
        "canonical_text": "In Tiny-Mite and Mitey-Mite, full-speed open-field blocking is prohibited. All blocking must be in the chest/shoulder area. Blocks below the waist are illegal in all Pop Warner youth divisions. Crack-back blocks are illegal in all youth divisions.",
        "plain_language_text": "Ages 5-9: no full-speed open-field blocking. All ages: no blocks below the waist, no crack-back blocks.",
        "scope": {"age_brackets": ["U8", "U10", "U12", "U14"], "division_types": ["tackle", "competitive"], "league_levels": ["all"]},
        "safety_critical": True, "game_day_critical": False, "display_priority": 10,
        "governing_body_source": "Pop_Warner", "tags": ["blocking", "safety", "illegal_contact"],
        "normative_certainty": 0.97,
    },
]
