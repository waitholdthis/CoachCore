import axios from "axios";
import type {
  League, RuleUpload, ActiveRule, QuickRefCard,
  ConflictRecord, ConflictSummary, ChatResponse, RuleDiff,
  Sport,
  PracticePlan, PracticePlanGenerate, LTADStageInfo,
  SCProgram, SCProgramGenerate,
  GamePlan,
  Drill, PracticeTemplate,
  CalendarEvent,
  Season, SeasonWeek,
  Player, RosterTeam, PerformanceRecord,
  Resource, SavedItem,
} from "./types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Leagues ──────────────────────────────────────────────────────────────────

export const leaguesApi = {
  list: (sport?: Sport) =>
    api.get<League[]>("/leagues", { params: sport ? { sport } : undefined }).then(r => r.data),

  get: (id: string) =>
    api.get<League>(`/leagues/${id}`).then(r => r.data),

  create: (payload: Partial<League>) =>
    api.post<League>("/leagues", payload).then(r => r.data),

  update: (id: string, payload: Partial<League>) =>
    api.patch<League>(`/leagues/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/leagues/${id}`),

  uploads: (id: string) =>
    api.get<RuleUpload[]>(`/leagues/${id}/uploads`).then(r => r.data),
};

// ── Rules ────────────────────────────────────────────────────────────────────

export const rulesApi = {
  resolve: (params: {
    sport: string;
    age_bracket: string;
    division_type?: string;
    league_id?: string;
  }) =>
    api.get<ActiveRule[]>("/rules/resolve", { params }).then(r => r.data),

  quickRef: (params: {
    sport: string;
    age_bracket: string;
    division_type?: string;
    league_id?: string;
  }) =>
    api.get<QuickRefCard>("/rules/quick-ref", { params }).then(r => r.data),
};

// ── Ingestion ────────────────────────────────────────────────────────────────

export const ingestApi = {
  upload: (leagueId: string, file: File, sport: string, ageBracket: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sport", sport);
    form.append("age_bracket", ageBracket);
    return api
      .post<RuleUpload>(`/ingest/upload/${leagueId}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(r => r.data);
  },

  status: (uploadId: string) =>
    api.get<RuleUpload>(`/ingest/status/${uploadId}`).then(r => r.data),

  conflicts: (leagueId: string, opts?: { unresolved_only?: boolean; safety_only?: boolean }) =>
    api.get<ConflictRecord[]>(`/ingest/conflicts/${leagueId}`, { params: opts }).then(r => r.data),

  conflictSummary: (leagueId: string) =>
    api.get<ConflictSummary>(`/ingest/conflicts/${leagueId}/summary`).then(r => r.data),

  resolveConflict: (conflictId: string, resolution: string, notes?: string) =>
    api.patch<ConflictRecord>(`/ingest/conflicts/${conflictId}/resolve`, {
      resolution,
      admin_notes: notes,
    }).then(r => r.data),
};

// ── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  ask: (payload: {
    question: string;
    sport?: string;
    age_bracket?: string;
    division_type?: string;
    league_id?: string;
    conversation_history?: Array<{ role: string; content: string }>;
  }) =>
    api.post<ChatResponse>("/chat", payload).then(r => r.data),
};

// ── Diff ─────────────────────────────────────────────────────────────────────

export const diffApi = {
  generate: (payload: {
    home: { sport: string; age_bracket: string; division_type?: string; league_id?: string; label: string };
    away: { sport: string; age_bracket: string; division_type?: string; league_id?: string; label: string };
  }) =>
    api.post<RuleDiff>("/diff", payload).then(r => r.data),
};

// ── Practice Plans ────────────────────────────────────────────────────────────

export const practiceApi = {
  list: () => api.get<PracticePlan[]>("/practice").then(r => r.data),
  get: (id: string) => api.get<PracticePlan>(`/practice/${id}`).then(r => r.data),
  generate: (payload: PracticePlanGenerate) => api.post<PracticePlan>("/practice/generate", payload).then(r => r.data),
  ltad: (age_bracket: string) => api.get<LTADStageInfo>(`/practice/ltad/${age_bracket}`).then(r => r.data),
  delete: (id: string) => api.delete(`/practice/${id}`),
};

// ── S&C Programs ──────────────────────────────────────────────────────────────

export const conditioningApi = {
  list: () => api.get<SCProgram[]>("/conditioning").then(r => r.data),
  get: (id: string) => api.get<SCProgram>(`/conditioning/${id}`).then(r => r.data),
  generate: (payload: SCProgramGenerate) => api.post<SCProgram>("/conditioning/generate", payload).then(r => r.data),
  delete: (id: string) => api.delete(`/conditioning/${id}`),
};

// ── Game Plans ────────────────────────────────────────────────────────────────

export const gameplanApi = {
  list: () => api.get<GamePlan[]>("/gameplan").then(r => r.data),
  get: (id: string) => api.get<GamePlan>(`/gameplan/${id}`).then(r => r.data),
  create: (payload: Omit<GamePlan, "id" | "created_at" | "updated_at" | "key_rules_context">) =>
    api.post<GamePlan>("/gameplan", payload).then(r => r.data),
  update: (id: string, payload: Partial<Omit<GamePlan, "id" | "created_at" | "updated_at" | "key_rules_context">>) =>
    api.patch<GamePlan>(`/gameplan/${id}`, payload).then(r => r.data),
  delete: (id: string) => api.delete(`/gameplan/${id}`),
};

// ── Drills ────────────────────────────────────────────────────────────────────

export const drillsApi = {
  list: (params?: { sport?: string; difficulty?: string; skill_focus?: string; search?: string; featured_only?: boolean }) =>
    api.get<Drill[]>("/drills", { params }).then(r => r.data),
  featured: () => api.get<Drill[]>("/drills/featured").then(r => r.data),
  get: (id: string) => api.get<Drill>(`/drills/${id}`).then(r => r.data),
};

// ── Templates ─────────────────────────────────────────────────────────────────

export const templatesApi = {
  list: (params?: { sport?: string; age_bracket?: string; difficulty?: string; search?: string }) =>
    api.get<PracticeTemplate[]>("/templates", { params }).then(r => r.data),
  featured: () => api.get<PracticeTemplate[]>("/templates/featured").then(r => r.data),
  get: (id: string) => api.get<PracticeTemplate>(`/templates/${id}`).then(r => r.data),
};

// ── Calendar ──────────────────────────────────────────────────────────────────

export const calendarApi = {
  list: (params?: { start?: string; end?: string; sport?: string; event_type?: string }) =>
    api.get<CalendarEvent[]>("/calendar", { params }).then(r => r.data),
  create: (payload: Omit<CalendarEvent, "id"|"created_at"|"updated_at">) =>
    api.post<CalendarEvent>("/calendar", payload).then(r => r.data),
  update: (id: string, payload: Partial<CalendarEvent>) =>
    api.patch<CalendarEvent>(`/calendar/${id}`, payload).then(r => r.data),
  delete: (id: string) => api.delete(`/calendar/${id}`),
};

// ── Seasons ───────────────────────────────────────────────────────────────────

export const seasonsApi = {
  list: () => api.get<Season[]>("/seasons").then(r => r.data),
  get: (id: string) => api.get<Season>(`/seasons/${id}`).then(r => r.data),
  create: (payload: Omit<Season, "id"|"created_at"|"updated_at"|"total_weeks">) =>
    api.post<Season>("/seasons", payload).then(r => r.data),
  update: (id: string, payload: Partial<Season>) =>
    api.patch<Season>(`/seasons/${id}`, payload).then(r => r.data),
  delete: (id: string) => api.delete(`/seasons/${id}`),
  weeks: (id: string) => api.get<SeasonWeek[]>(`/seasons/${id}/weeks`).then(r => r.data),
  updateWeek: (seasonId: string, weekNumber: number, payload: Partial<SeasonWeek>) =>
    api.patch<SeasonWeek>(`/seasons/${seasonId}/weeks/${weekNumber}`, payload).then(r => r.data),
};

// ── Roster ────────────────────────────────────────────────────────────────────

export const rosterApi = {
  teams: () => api.get<RosterTeam[]>("/roster/teams").then(r => r.data),
  team: (id: string) => api.get<RosterTeam>(`/roster/teams/${id}`).then(r => r.data),
  createTeam: (payload: Omit<RosterTeam, "id"|"created_at"|"updated_at"|"players">) =>
    api.post<RosterTeam>("/roster/teams", payload).then(r => r.data),
  updateTeam: (id: string, payload: Partial<RosterTeam>) =>
    api.patch<RosterTeam>(`/roster/teams/${id}`, payload).then(r => r.data),
  deleteTeam: (id: string) => api.delete(`/roster/teams/${id}`),
  addPlayer: (teamId: string, playerId: string) =>
    api.post(`/roster/teams/${teamId}/players`, { player_id: playerId }).then(r => r.data),
  removePlayer: (teamId: string, playerId: string) =>
    api.delete(`/roster/teams/${teamId}/players/${playerId}`),
  players: (sport?: string) =>
    api.get<Player[]>("/roster/players", { params: sport ? { sport } : undefined }).then(r => r.data),
  player: (id: string) => api.get<Player>(`/roster/players/${id}`).then(r => r.data),
  createPlayer: (payload: Omit<Player, "id"|"created_at"|"updated_at">) =>
    api.post<Player>("/roster/players", payload).then(r => r.data),
  updatePlayer: (id: string, payload: Partial<Player>) =>
    api.patch<Player>(`/roster/players/${id}`, payload).then(r => r.data),
  deletePlayer: (id: string) => api.delete(`/roster/players/${id}`),
};

// ── Performance ───────────────────────────────────────────────────────────────

export const performanceApi = {
  list: (playerId?: string) =>
    api.get<PerformanceRecord[]>("/performance", { params: playerId ? { player_id: playerId } : undefined }).then(r => r.data),
  player: (playerId: string) =>
    api.get<PerformanceRecord[]>(`/performance/player/${playerId}`).then(r => r.data),
  create: (payload: Omit<PerformanceRecord, "id"|"created_at">) =>
    api.post<PerformanceRecord>("/performance", payload).then(r => r.data),
  delete: (id: string) => api.delete(`/performance/${id}`),
};

// ── Resources ─────────────────────────────────────────────────────────────────

export const resourcesApi = {
  list: (params?: { resource_type?: string; sport?: string; search?: string }) =>
    api.get<Resource[]>("/resources", { params }).then(r => r.data),
  featured: () => api.get<Resource[]>("/resources/featured").then(r => r.data),
  get: (id: string) => api.get<Resource>(`/resources/${id}`).then(r => r.data),
};

// ── Saved Items ───────────────────────────────────────────────────────────────

export const savedApi = {
  list: (item_type?: string) =>
    api.get<SavedItem[]>("/saved", { params: item_type ? { item_type } : undefined }).then(r => r.data),
  save: (payload: { item_type: string; item_id: string; title: string }) =>
    api.post<SavedItem>("/saved", payload).then(r => r.data),
  unsave: (id: string) => api.delete(`/saved/${id}`),
  unsaveByItem: (item_type: string, item_id: string) =>
    api.delete(`/saved/by-item/${item_type}/${item_id}`),
};
