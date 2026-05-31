"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { conditioningApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const SPORTS = [
  { value: "soccer", label: "Soccer" },
  { value: "basketball", label: "Basketball" },
  { value: "baseball", label: "Baseball" },
  { value: "football", label: "Football" },
  { value: "volleyball", label: "Volleyball" },
  { value: "other", label: "Other" },
];

const AGE_BRACKETS = [
  { value: "U6", label: "U6" },
  { value: "U8", label: "U8" },
  { value: "U10", label: "U10" },
  { value: "U12", label: "U12" },
  { value: "U14", label: "U14" },
  { value: "high_school", label: "High School" },
];

const SEASON_PHASES = [
  { value: "off_season", label: "Off Season" },
  { value: "pre_season", label: "Pre Season" },
  { value: "in_season", label: "In Season" },
  { value: "post_season", label: "Post Season" },
];

export default function NewConditioningPage() {
  const router = useRouter();
  const [sport, setSport] = useState("soccer");
  const [ageBracket, setAgeBracket] = useState("");
  const [seasonPhase, setSeasonPhase] = useState("off_season");
  const [weeks, setWeeks] = useState(4);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [goals, setGoals] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageBracket) {
      setError("Please select an age bracket.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const prog = await conditioningApi.generate({
        sport,
        age_bracket: ageBracket,
        season_phase: seasonPhase,
        weeks,
        days_per_week: daysPerWeek,
        goals: goals || null,
      });
      router.push(`/dashboard/conditioning/${prog.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail ?? err?.message ?? "Generation failed. Please try again.");
      setGenerating(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/conditioning"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Back to S&C Engine
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New S&C Program</h1>
        <p className="text-slate-500 text-sm mt-1">Claude will generate a macrocycle tailored to the LTAD stage and season phase.</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <h2 className="font-semibold text-slate-900">Program Parameters</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {SPORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Age Bracket</label>
              <select
                value={ageBracket}
                onChange={(e) => setAgeBracket(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              >
                <option value="">Select age bracket…</option>
                {AGE_BRACKETS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Season Phase</label>
            <select
              value={seasonPhase}
              onChange={(e) => setSeasonPhase(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {SEASON_PHASES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Program Length (weeks)</label>
              <input
                type="number"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                min={2}
                max={16}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sessions per Week</label>
              <input
                type="number"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                min={1}
                max={6}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Goals (optional)</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. Improve acceleration and first-step quickness, build aerobic base for late-season performance…"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-700">
          <p className="font-medium mb-1">LTAD Safety Guarantee</p>
          <p className="text-brand-600">Claude automatically applies age-appropriate constraints — no barbell work for U10, no heading drills for U10 soccer, proper loading progressions for all age groups.</p>
        </div>

        <button
          type="submit"
          disabled={generating}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
            generating
              ? "bg-brand-400 text-white cursor-not-allowed"
              : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md"
          )}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Claude is building your macrocycle…
            </>
          ) : (
            "Generate S&C Program"
          )}
        </button>
      </form>
    </div>
  );
}
