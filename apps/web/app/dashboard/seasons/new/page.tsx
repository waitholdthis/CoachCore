"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { seasonsApi } from "@/lib/api";

const SPORTS = ["Soccer", "Basketball", "Baseball", "Football", "Volleyball", "Other"];
const AGE_BRACKETS = ["U6", "U8", "U10", "U11", "U12", "U14", "U16", "U18", "high_school", "Adult"];

export default function NewSeasonPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Soccer");
  const [ageBracket, setAgeBracket] = useState("U12");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState<string[]>([""]);

  function addGoal() { setGoals((g) => [...g, ""]); }
  function updateGoal(i: number, val: string) {
    setGoals((g) => g.map((v, idx) => idx === i ? val : v));
  }
  function removeGoal(i: number) {
    setGoals((g) => g.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const season = await seasonsApi.create({
        title,
        sport: sport.toLowerCase(),
        age_bracket: ageBracket,
        start_date: startDate,
        end_date: endDate,
        description: description || null,
        goals: goals.filter(Boolean),
      });
      router.push(`/dashboard/seasons/${season.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to create season");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/seasons" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Season Planning
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Season Plan</h1>
        <p className="text-slate-500 text-sm mt-1">Define your season goals and dates to generate a weekly arc</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Season Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Fall 2026 Soccer Season"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              placeholder="Brief overview of the season..."
            />
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 text-sm">Season Goals</h2>
            <button
              type="button"
              onClick={addGoal}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={13} /> Add Goal
            </button>
          </div>
          <div className="space-y-2">
            {goals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={goal}
                  onChange={(e) => updateGoal(i, e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder={`Goal ${i + 1}…`}
                />
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGoal(i)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/dashboard/seasons"
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creating…" : "Create Season"}
          </button>
        </div>
      </form>
    </div>
  );
}
