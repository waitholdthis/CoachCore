export type Sport = "soccer" | "baseball" | "basketball" | "football";

export type AgeBracket =
  | "U6" | "U8" | "U10" | "U11" | "U12"
  | "U14" | "U16" | "U18" | "high_school";

export type DivisionType =
  | "recreational" | "competitive" | "travel"
  | "AAU" | "t_ball" | "coach_pitch" | "kid_pitch"
  | "flag" | "tackle" | "all";

export type RuleTier = "baseline" | "governing_body" | "local" | "tournament";

export type ConflictType = "OVERRIDE" | "RESTRICT" | "EXPAND" | "SUPPLEMENT" | "CONFLICT";
export type ConflictResolution = "LOCAL_OVERRIDES" | "BASELINE_APPLIES" | "PENDING_REVIEW";
export type IngestionStatus = "pending" | "processing" | "completed" | "failed" | "partial";

export interface RuleScope {
  age_brackets: string[];
  division_types: string[];
  league_levels: string[];
  temporal_qualifier?: string;
}

export interface Rule {
  id: string;
  sport: Sport;
  category: string;
  subcategory?: string;
  rule_tier: RuleTier;
  rule_type: string;
  canonical_text: string;
  plain_language_text?: string;
  scope: RuleScope;
  safety_critical: boolean;
  game_day_critical: boolean;
  display_priority: number;
  numeric_value?: number;
  numeric_unit?: string;
  governing_body_source?: string;
  tags: string[];
  normative_certainty?: number;
  human_resolved: boolean;
  human_resolution_choice?: string;
  league_id?: string;
  upload_id?: string;
  source_page?: number;
  source_paragraph?: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveRule extends Rule {
  provenance_tier: RuleTier;
  provenance_source: string;
  overridden_by_local: boolean;
}

export interface QuickRefCard {
  sport: Sport;
  age_bracket: string;
  league_id?: string;
  league_name?: string;
  tier_1: ActiveRule[];
  tier_2: ActiveRule[];
  local_override_count: number;
  local_overrides: ActiveRule[];
  safety_flags: ActiveRule[];
  generated_at: string;
  share_token?: string;
}

export interface League {
  id: string;
  name: string;
  sport: Sport;
  season?: string;
  governing_body?: string;
  age_brackets_served: string[];
  division_types_served: string[];
  contact_admin?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  upload_count: number;
  conflict_count: number;
}

export interface RuleUpload {
  id: string;
  league_id: string;
  original_filename: string;
  ingestion_status: IngestionStatus;
  page_count?: number;
  rules_extracted: number;
  conflict_count: number;
  safety_flag_count: number;
  ambiguous_rule_count: number;
  ocr_confidence_avg?: number;
  error_message?: string;
  uploaded_at: string;
  processing_completed_at?: string;
}

export interface ConflictRecord {
  id: string;
  league_id: string;
  sport: Sport;
  conflict_type: ConflictType;
  effective_scope: Record<string, unknown>;
  baseline_rule: Rule;
  local_rule: Rule;
  similarity_score?: number;
  classification_confidence?: number;
  resolution: ConflictResolution;
  coach_flag: boolean;
  flag_message?: string;
  safety_critical: boolean;
  verified_by_admin: boolean;
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ConflictSummary {
  league_id: string;
  total: number;
  pending_review: number;
  safety_critical: number;
  local_overrides: number;
  by_category: Record<string, number>;
}

export interface ChatSource {
  rule_id: string;
  canonical_text: string;
  source_label: string;
  rule_tier: string;
  confidence: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  timestamp?: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  safety_notice?: string;
  ambiguity_notice?: string;
  scope_used: Record<string, unknown>;
  generated_at: string;
}

export interface DiffEntry {
  category: string;
  subcategory?: string;
  diff_type: "MORE_RESTRICTIVE" | "MORE_PERMISSIVE" | "FUNDAMENTALLY_DIFFERENT" | "MISSING_IN_AWAY" | "MISSING_IN_HOME";
  severity_score: number;
  safety_critical: boolean;
  home_rule_text?: string;
  home_rule_source?: string;
  away_rule_text?: string;
  away_rule_source?: string;
  key_difference?: string;
}

export interface RuleDiff {
  home: {
    sport: Sport;
    age_bracket: string;
    division_type: string;
    league_id?: string;
    label: string;
  };
  away: {
    sport: Sport;
    age_bracket: string;
    division_type: string;
    league_id?: string;
    label: string;
  };
  entries: DiffEntry[];
  total_differences: number;
  safety_critical_differences: number;
  generated_at: string;
}

// ── Coaching Suite ────────────────────────────────────────────────────────────

export interface PracticePlanGenerate {
  sport: string;
  age_bracket: string;
  focus_area: string;
  duration_minutes?: number;
  division_type?: string | null;
  league_id?: string | null;
  additional_context?: string | null;
}

export interface PracticeActivity {
  name: string;
  duration_minutes: number;
  description: string;
  setup: string;
  coaching_points: string[];
  progressions: string[];
  equipment: string[];
  intensity: "low" | "medium" | "high";
  ltad_component: string;
  player_count: string;
}

export interface PracticePhase {
  name: string;
  duration_minutes: number;
  color: "amber" | "blue" | "green" | "purple" | "slate";
  activities: PracticeActivity[];
}

export interface PracticePlan {
  id: string;
  sport: string;
  age_bracket: string;
  division_type: string | null;
  league_id: string | null;
  title: string;
  overview: string;
  focus_area: string;
  duration_minutes: number;
  phases: PracticePhase[];
  equipment_list: string[];
  safety_notes: string[];
  coaching_cues: string[];
  generation_params: Record<string, unknown> | null;
  created_at: string;
}

export interface LTADStageInfo {
  stage_name: string;
  focus: string;
  key_components: string[];
  prohibited: string[];
  sc_guidelines: string;
  max_session_minutes: number;
  max_sessions_per_week: number;
  intensity_ceiling: string;
  notes: string;
  sport_constraints: string[];
}

export interface SCProgramGenerate {
  sport: string;
  age_bracket: string;
  season_phase?: string;
  weeks?: number;
  days_per_week?: number;
  league_id?: string | null;
  goals?: string | null;
}

export interface MacrocycleWeek {
  week: number;
  phase: string;
  sessions: Array<{
    day: number;
    focus: string;
    exercises: Array<{ name: string; sets: number; reps: string; notes?: string }>;
  }>;
}

export interface SCProgram {
  id: string;
  sport: string;
  age_bracket: string;
  ltad_stage: string;
  season_phase: string;
  weeks: number;
  days_per_week: number;
  title: string;
  overview: string;
  safety_constraints: string[];
  macrocycle: MacrocycleWeek[];
  generation_params: Record<string, unknown> | null;
  created_at: string;
}

export interface FieldPosition {
  id: string;
  player_name: string;
  number?: number;
  x: number;
  y: number;
  position_label: string;
}

export interface GamePlan {
  id: string;
  sport: string;
  age_bracket: string;
  league_id: string | null;
  title: string;
  opponent_name: string | null;
  formation: string | null;
  field_positions: FieldPosition[];
  tactical_notes: string | null;
  set_pieces: string[];
  key_rules_context: unknown[];
  created_at: string;
  updated_at: string;
}
