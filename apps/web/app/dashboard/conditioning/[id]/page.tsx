"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Printer, BarChart2, Calendar } from "lucide-react";
import { conditioningApi } from "@/lib/api";
import type { SCProgram, MacrocycleWeek } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PHASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Anatomical Adaptation": { bg: "bg-blue-50",   text: "text-blue-800",   border: "border-blue-200" },
  "Strength":              { bg: "bg-purple-50",  text: "text-purple-800", border: "border-purple-200" },
  "Power":                 { bg: "bg-amber-50",   text: "text-amber-800",  border: "border-amber-200" },
  "Competition":           { bg: "bg-green-50",   text: "text-green-800",  border: "border-green-200" },
  "Hypertrophy":           { bg: "bg-orange-50",  text: "text-orange-800", border: "border-orange-200" },
  "Recovery":              { bg: "bg-slate-50",   text: "text-slate-700",  border: "border-slate-200" },
};

function phaseStyle(phase: string) {
  for (const [key, style] of Object.entries(PHASE_COLORS)) {
    if (phase.toLowerCase().includes(key.toLowerCase())) return style;
  }
  return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
}

function WeekCard({ week }: { week: MacrocycleWeek }) {
  const style = phaseStyle(week.phase);
  return (
    <div className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>Week {week.week}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-white border ${style.border} ${style.text}`}>
          {week.phase}
        </span>
      </div>
      <div className="space-y-3">
        {week.sessions.map((session) => (
          <div key={session.day} className="bg-white rounded-lg border border-white/80 p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 mb-2">Day {session.day} — {session.focus}</p>
            <ul className="space-y-1">
              {session.exercises.map((ex, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>
                    <span className="font-medium">{ex.name}</span>
                    {" · "}
                    <span className="text-slate-500">{ex.sets}×{ex.reps}</span>
                    {ex.notes && <span className="text-slate-400"> — {ex.notes}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const SEASON_PHASE_LABELS: Record<string, string> = {
  off_season: "Off Season",
  pre_season: "Pre Season",
  in_season: "In Season",
  post_season: "Post Season",
};

export default function SCProgramPage() {
  const { id } = useParams<{ id: string }>();
  const [prog, setProg] = useState<SCProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    conditioningApi
      .get(id)
      .then(setProg)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load program"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (error || !prog) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error ?? "Program not found"}
        </div>
        <Link href="/dashboard/conditioning" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mt-4">
          <ArrowLeft size={15} /> Back to S&C Engine
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto print:p-4">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/dashboard/conditioning" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Back to S&C Engine
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Printer size={15} /> Print
        </button>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{prog.title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 font-medium capitalize">{prog.sport}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{prog.age_bracket}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">{prog.ltad_stage}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            {SEASON_PHASE_LABELS[prog.season_phase] ?? prog.season_phase}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand-700">{prog.weeks}</p>
          <p className="text-xs text-slate-500 mt-0.5">Weeks</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand-700">{prog.days_per_week}</p>
          <p className="text-xs text-slate-500 mt-0.5">Sessions / week</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-brand-700">{prog.weeks * prog.days_per_week}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total sessions</p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-slate-900 mb-2">Program Overview</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{prog.overview}</p>
      </div>

      {/* Safety Constraints */}
      {prog.safety_constraints.length > 0 && (
        <div className="bg-safety-50 border border-safety-100 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-safety-600" />
            <h2 className="font-semibold text-safety-700">Safety Constraints for {prog.age_bracket}</h2>
          </div>
          <ul className="space-y-1.5">
            {prog.safety_constraints.map((c, i) => (
              <li key={i} className="text-sm text-safety-700 flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-safety-500 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Macrocycle */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900">Macrocycle</h2>
          <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
            <Calendar size={12} /> Generated {formatDate(prog.created_at)}
          </span>
        </div>
        {prog.macrocycle.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No macrocycle data — this may be an Active Start (U6) program where formal S&C is not appropriate.
          </div>
        ) : (
          <div className={`grid gap-4 ${prog.macrocycle.length > 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
            {prog.macrocycle.map((week) => (
              <WeekCard key={week.week} week={week} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
