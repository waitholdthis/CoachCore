"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, UserCheck, TrendingUp, Users } from "lucide-react";
import { rosterApi } from "@/lib/api";
import type { RosterTeam, Player } from "@/lib/types";

interface AddPlayerForm {
  first_name: string;
  last_name: string;
  number: string;
  position: string;
  age: string;
}

const EMPTY_FORM: AddPlayerForm = {
  first_name: "",
  last_name: "",
  number: "",
  position: "",
  age: "",
};

export default function TeamRosterPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<RosterTeam | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AddPlayerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    rosterApi
      .team(id)
      .then((t) => {
        setTeam(t);
        setPlayers(t.players ?? []);
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load team"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !team) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const newPlayer = await rosterApi.createPlayer({
        first_name: form.first_name,
        last_name: form.last_name,
        number: form.number ? parseInt(form.number, 10) : null,
        position: form.position || null,
        age: form.age ? parseInt(form.age, 10) : null,
        sport: team.sport,
        notes: null,
        emergency_contact: null,
        medical_notes: null,
      });
      await rosterApi.addPlayer(id, newPlayer.id);
      setPlayers((prev) => [...prev, newPlayer]);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setFormError(e?.response?.data?.detail ?? e?.message ?? "Failed to add player");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemovePlayer(playerId: string) {
    if (!window.confirm("Remove player from team?")) return;
    try {
      await rosterApi.removePlayer(id, playerId);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="h-8 w-32 bg-slate-100 animate-pulse rounded mb-8" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link href="/dashboard/team" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error ?? "Team not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/dashboard/team" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Team Management
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-100 text-brand-700 capitalize">
            {team.sport}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
            {team.age_bracket}
          </span>
          {team.season_label && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">
              {team.season_label}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
        {team.head_coach && (
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
            <UserCheck size={14} /> {team.head_coach}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player roster */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-brand-600" />
                Roster
                <span className="ml-1 text-xs font-normal text-slate-400">({players.length} players)</span>
              </h2>
            </div>
            {players.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No players yet — add one to get started</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-400">#</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Name</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Position</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Age</th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">
                        {player.number ?? "—"}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {player.first_name} {player.last_name}
                      </td>
                      <td className="px-3 py-3 text-slate-500">{player.position ?? "—"}</td>
                      <td className="px-3 py-3 text-slate-500">{player.age ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/performance?player_id=${player.id}`}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            <TrendingUp size={12} /> View Stats
                          </Link>
                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove from team"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add player panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Plus size={16} className="text-brand-600" /> Add Player
          </h2>
          <form onSubmit={handleAddPlayer} className="space-y-3">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{formError}</div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Number</label>
                <input
                  type="number"
                  value={form.number}
                  onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  min={0}
                  max={99}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  min={4}
                  max={25}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Position</label>
              <input
                value={form.position}
                onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="Forward, GK, PG…"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors mt-2"
            >
              {submitting ? "Adding…" : "Add Player"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
