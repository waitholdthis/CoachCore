"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, Plus, Trash2, Activity } from "lucide-react";
import { performanceApi, rosterApi } from "@/lib/api";
import type { PerformanceRecord, Player } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface MetricGroup {
  metric_type: string;
  records: PerformanceRecord[];
  latest: number;
  prev: number | null;
  unit: string | null;
}

function groupByMetric(records: PerformanceRecord[]): MetricGroup[] {
  const map = new Map<string, PerformanceRecord[]>();
  for (const r of records) {
    if (!map.has(r.metric_type)) map.set(r.metric_type, []);
    map.get(r.metric_type)!.push(r);
  }
  const groups: MetricGroup[] = [];
  for (const [metric_type, recs] of map.entries()) {
    const sorted = [...recs].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    groups.push({
      metric_type,
      records: sorted,
      latest: sorted[0].value,
      prev: sorted.length > 1 ? sorted[1].value : null,
      unit: sorted[0].unit,
    });
  }
  return groups;
}

interface AddRecordForm {
  metric_type: string;
  value: string;
  unit: string;
  context: string;
  notes: string;
}

const EMPTY_FORM: AddRecordForm = {
  metric_type: "",
  value: "",
  unit: "",
  context: "",
  notes: "",
};

function PerformanceDashboard() {
  const searchParams = useSearchParams();
  const initialPlayerId = searchParams.get("player_id") ?? "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(initialPlayerId);
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [form, setForm] = useState<AddRecordForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    rosterApi.players()
      .then(setPlayers)
      .catch(() => {})
      .finally(() => setLoadingPlayers(false));
  }, []);

  const loadRecords = useCallback((playerId: string) => {
    if (!playerId) { setRecords([]); return; }
    setLoadingRecords(true);
    performanceApi.player(playerId)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false));
  }, []);

  useEffect(() => {
    loadRecords(selectedPlayerId);
  }, [selectedPlayerId, loadRecords]);

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const groups = groupByMetric(records);
  const sortedRecords = [...records].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayerId || !form.metric_type || !form.value) return;
    setSubmitting(true);
    setError(null);
    try {
      const rec = await performanceApi.create({
        player_id: selectedPlayerId,
        recorded_at: new Date().toISOString(),
        sport: selectedPlayer?.sport ?? null,
        metric_type: form.metric_type,
        value: parseFloat(form.value),
        unit: form.unit || null,
        context: form.context || null,
        notes: form.notes || null,
      });
      setRecords((prev) => [rec, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to add record");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRecord(id: string) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await performanceApi.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  function TrendIcon({ latest, prev }: { latest: number; prev: number | null }) {
    if (prev === null) return <Minus size={14} className="text-slate-400" />;
    if (latest > prev) return <TrendingUp size={14} className="text-green-500" />;
    if (latest < prev) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-slate-400" />;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Performance Analysis</h1>
        <p className="text-slate-500 text-sm mt-1">Track and analyze player performance metrics over time</p>
      </div>

      {/* Player selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <label className="block text-xs font-medium text-slate-700 mb-2">Select Player</label>
        {loadingPlayers ? (
          <div className="h-9 bg-slate-100 animate-pulse rounded-lg w-64" />
        ) : (
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">Choose a player…</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
                {p.position ? ` — ${p.position}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedPlayerId ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Activity size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No player selected</p>
          <p className="text-slate-400 text-sm">Select a player above to view their performance stats.</p>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          {loadingRecords ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}
            </div>
          ) : groups.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {groups.map((g) => (
                <div key={g.metric_type} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <p className="text-xs text-slate-500 font-medium mb-2 capitalize">{g.metric_type.replace(/_/g, " ")}</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-slate-900">{g.latest}</span>
                    {g.unit && <span className="text-xs text-slate-400 mb-1">{g.unit}</span>}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendIcon latest={g.latest} prev={g.prev} />
                    {g.prev !== null && (
                      <span className={`text-xs font-medium ${g.latest > g.prev ? "text-green-600" : g.latest < g.prev ? "text-red-500" : "text-slate-400"}`}>
                        {g.latest > g.prev ? "+" : ""}{(g.latest - g.prev).toFixed(1)}
                      </span>
                    )}
                    {g.prev === null && <span className="text-xs text-slate-400">First entry</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add record form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Plus size={16} className="text-brand-600" /> Add Record
              </h2>
              <form onSubmit={handleAddRecord} className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{error}</div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Metric Type *</label>
                  <input
                    required
                    value={form.metric_type}
                    onChange={(e) => setForm(f => ({ ...f, metric_type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="sprint_40m, vertical_jump…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Value *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={form.value}
                      onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>
                    <input
                      value={form.unit}
                      onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      placeholder="sec, cm, kg…"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Context</label>
                  <input
                    value={form.context}
                    onChange={(e) => setForm(f => ({ ...f, context: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="Pre-season, Week 4…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Adding…" : "Add Record"}
                </button>
              </form>
            </div>

            {/* Records table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">All Records</h2>
              </div>
              {loadingRecords ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
              ) : sortedRecords.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity size={36} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No records yet — add the first one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400">Metric</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Value</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Context</th>
                        <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Date</th>
                        <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-400"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecords.map((rec) => (
                        <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-slate-900 capitalize">
                            {rec.metric_type.replace(/_/g, " ")}
                          </td>
                          <td className="px-3 py-3 text-slate-700 font-mono">
                            {rec.value}{rec.unit ? ` ${rec.unit}` : ""}
                          </td>
                          <td className="px-3 py-3 text-slate-500 text-xs">{rec.context ?? "—"}</td>
                          <td className="px-3 py-3 text-slate-400 text-xs">{formatDate(rec.recorded_at)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
      <PerformanceDashboard />
    </Suspense>
  );
}
