"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, Info } from "lucide-react";
import { practiceApi } from "@/lib/api";
import type { LTADStageInfo } from "@/lib/types";
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

export default function NewPracticePage() {
  const router = useRouter();
  const [sport, setSport] = useState("soccer");
  const [ageBracket, setAgeBracket] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [divisionType, setDivisionType] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const [ltad, setLtad] = useState<LTADStageInfo | null>(null);
  const [ltadLoading, setLtadLoading] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ageBracket) {
      setLtad(null);
      return;
    }
    setLtadLoading(true);
    setLtad(null);
    practiceApi
      .ltad(ageBracket)
      .then(setLtad)
      .catch(() => setLtad(null))
      .finally(() => setLtadLoading(false));
  }, [ageBracket]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!focusArea.trim()) {
      setError("Focus area is required.");
      return;
    }
    if (!ageBracket) {
      setError("Please select an age bracket.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const plan = await practiceApi.generate({
        sport,
        age_bracket: ageBracket,
        focus_area: focusArea,
        duration_minutes: durationMinutes,
        division_type: divisionType || null,
        additional_context: additionalContext || null,
      });
      router.push(`/dashboard/practice/${plan.id}`);
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
          href="/dashboard/practice"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Back to Practice Builder
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Practice Session</h1>
        <p className="text-slate-500 text-sm mt-1">Claude will generate a complete, LTAD-compliant session plan.</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
          <h2 className="font-semibold text-slate-900">Session Details</h2>

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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Focus Area <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="e.g. Passing and movement off the ball"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={20}
                max={180}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Division Type (optional)</label>
              <input
                type="text"
                value={divisionType}
                onChange={(e) => setDivisionType(e.target.value)}
                placeholder="e.g. Recreational"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Additional Context (optional)</label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Anything else Claude should know — team size, skill level, recent focus, available equipment…"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* LTAD Info Box */}
        {ltadLoading && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 flex items-center gap-2 text-brand-700 text-sm">
            <Loader2 size={15} className="animate-spin" />
            Loading LTAD stage guidance…
          </div>
        )}

        {ltad && !ltadLoading && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-brand-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-brand-800">{ltad.stage_name}</p>
                <p className="text-sm text-brand-700 mt-0.5">{ltad.focus}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-brand-700 uppercase tracking-wide mb-2">Key Components</p>
              <div className="flex flex-wrap gap-1.5">
                {ltad.key_components.map((c) => (
                  <span key={c} className="text-xs px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-2.5 text-center border border-brand-100">
                <p className="font-bold text-brand-900 text-base">{ltad.max_session_minutes}</p>
                <p className="text-brand-600">Max min/session</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 text-center border border-brand-100">
                <p className="font-bold text-brand-900 text-base">{ltad.max_sessions_per_week}</p>
                <p className="text-brand-600">Sessions/week</p>
              </div>
              <div className="bg-white rounded-lg p-2.5 text-center border border-brand-100">
                <p className="font-bold text-brand-900 text-sm capitalize">{ltad.intensity_ceiling}</p>
                <p className="text-brand-600">Max intensity</p>
              </div>
            </div>

            {ltad.prohibited.length > 0 && (
              <div className="bg-safety-50 border border-safety-100 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={14} className="text-safety-600" />
                  <p className="text-xs font-semibold text-safety-700 uppercase tracking-wide">Prohibited at this stage</p>
                </div>
                <ul className="space-y-1">
                  {ltad.prohibited.map((item) => (
                    <li key={item} className="text-xs text-safety-700 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-safety-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ltad.notes && (
              <p className="text-xs text-brand-700 italic">{ltad.notes}</p>
            )}
          </div>
        )}

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
              Claude is building your session plan…
            </>
          ) : (
            "Generate Practice Plan"
          )}
        </button>
      </form>
    </div>
  );
}
