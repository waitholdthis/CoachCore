import axios from "axios";
import type {
  League, RuleUpload, ActiveRule, QuickRefCard,
  ConflictRecord, ConflictSummary, ChatResponse, RuleDiff,
  Sport,
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
