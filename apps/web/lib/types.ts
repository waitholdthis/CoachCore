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
