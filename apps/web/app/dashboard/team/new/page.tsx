"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { rosterApi } from "@/lib/api";

const SPORTS = ["Soccer", "Basketball", "Baseball", "Football", "Volleyball", "Other"];
const AGE_BRACKETS = ["U6", "U8", "U10", "U11", "U12", "U14", "U16", "U18", "high_school", "Adult"];

export default function NewTeamPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sport, setSport] = useState("Soccer");
  const [ageBracket, setAgeBracket] = useState("U12");
  const [seasonLabel, setSeasonLabel] = useState("");
  const [headCoach, setHeadCoach] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setError(null);
    try {
      const team = await rosterApi.createTeam({
        name,
        sport: sport.toLowerCase(),
        age_bracket: ageBracket,
        season_label: seasonLabel || null,
        head_coach: headCoach || null,
      });
      router.push(`/dashboard/team/${team.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to create team");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/team" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Team Management
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create New Team</h1>
        <p className="text-slate-500 text-sm mt-1">Set up your team info — you can add players on the next step</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Team Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Thunder U12 Soccer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Sport *</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Age Bracket *</label>
              <select
                value={ageBracket}
                onChange={(e) => setAgeBracket(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {AGE_BRACKETS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Season Label</label>
            <input
              value={seasonLabel}
              onChange={(e) => setSeasonLabel(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Fall 2026, Spring Season…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Head Coach</label>
            <input
              value={headCoach}
              onChange={(e) => setHeadCoach(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Coach name…"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/dashboard/team"
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creating…" : "Create Team"}
          </button>
        </div>
      </form>
    </div>
  );
}
