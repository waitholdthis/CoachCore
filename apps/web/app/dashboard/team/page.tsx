"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Users, Trash2, UserCheck } from "lucide-react";
import { rosterApi } from "@/lib/api";
import type { RosterTeam } from "@/lib/types";

export default function TeamPage() {
  const [teams, setTeams] = useState<RosterTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    rosterApi
      .teams()
      .then(setTeams)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load teams"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    try {
      await rosterApi.deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to delete team");
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your rosters, players, and team info</p>
        </div>
        <Link
          href="/dashboard/team/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New Team
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No teams yet</p>
          <p className="text-slate-400 text-sm mb-6">Create your first team to start managing rosters.</p>
          <Link
            href="/dashboard/team/new"
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Create Team
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group relative">
              <Link href={`/dashboard/team/${team.id}`} className="block">
                <div className="flex gap-2 mb-3 flex-wrap">
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
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-700 transition-colors pr-8">
                  {team.name}
                </h3>
                {team.head_coach && (
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <UserCheck size={12} /> {team.head_coach}
                  </p>
                )}
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Users size={12} />
                  {team.players?.length ?? 0} players
                </p>
              </Link>
              <button
                onClick={() => handleDelete(team.id, team.name)}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete team"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
