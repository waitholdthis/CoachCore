"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Printer, AlertTriangle, ChevronRight } from "lucide-react";
import { practiceApi } from "@/lib/api";
import type { PracticePlan, PracticePhase, PracticeActivity } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

const PHASE_COLORS: Record<PracticePhase["color"], { border: string; bg: string; badge: string; text: string }> = {
  amber:  { border: "border-l-amber-400",  bg: "bg-amber-50",  badge: "bg-amber-100 text-amber-800",  text: "text-amber-800" },
  blue:   { border: "border-l-blue-400",   bg: "bg-blue-50",   badge: "bg-blue-100 text-blue-800",    text: "text-blue-800" },
  green:  { border: "border-l-green-400",  bg: "bg-green-50",  badge: "bg-green-100 text-green-800",  text: "text-green-800" },
  purple: { border: "border-l-purple-400", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-800", text: "text-purple-800" },
  slate:  { border: "border-l-slate-400",  bg: "bg-slate-50",  badge: "bg-slate-100 text-slate-700",  text: "text-slate-700" },
};

const PHASE_TIMELINE_BG: Record<PracticePhase["color"], string> = {
  amber:  "bg-amber-400",
  blue:   "bg-blue-400",
  green:  "bg-green-400",
  purple: "bg-purple-400",
  slate:  "bg-slate-400",
};

const INTENSITY_DOT: Record<PracticeActivity["intensity"], string> = {
  low:    "bg-green-400",
  medium: "bg-yellow-400",
  high:   "bg-red-400",
};

export default function PracticePlanPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    practiceApi
      .get(id)
      .then(setPlan)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load plan"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error ?? "Plan not found"}
        </div>
        <Link href="/dashboard/practice" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mt-4">
          <ArrowLeft size={15} /> Back to Practice Builder
        </Link>
      </div>
    );
  }

  const totalMinutes = plan.duration_minutes;

  return (
    <div className="p-8 max-w-5xl mx-auto print:p-4">
      {/* Back + print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/dashboard/practice"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Practice Builder
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          <Printer size={15} /> Print
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{plan.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 font-medium capitalize">
            {plan.sport}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            {plan.age_bracket}
          </span>
          {plan.division_type && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
              {plan.division_type}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={12} /> {plan.duration_minutes} min
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar size={12} /> {formatDate(plan.created_at)}
          </span>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        <p className="text-sm text-slate-700 leading-relaxed">{plan.overview}</p>
      </div>

      {/* Phase timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Session Timeline</p>
        <div className="flex rounded-lg overflow-hidden h-8 mb-3">
          {plan.phases.map((phase) => {
            const pct = (phase.duration_minutes / totalMinutes) * 100;
            return (
              <div
                key={phase.name}
                className={cn("flex items-center justify-center text-white text-xs font-medium", PHASE_TIMELINE_BG[phase.color])}
                style={{ width: `${pct}%` }}
                title={`${phase.name} — ${phase.duration_minutes} min`}
              >
                {pct > 12 && `${phase.duration_minutes}m`}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3">
          {plan.phases.map((phase) => (
            <div key={phase.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={cn("w-2.5 h-2.5 rounded-sm inline-block", PHASE_TIMELINE_BG[phase.color])} />
              {phase.name} ({phase.duration_minutes} min)
            </div>
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-6 mb-8">
        {plan.phases.map((phase) => {
          const colors = PHASE_COLORS[phase.color];
          return (
            <div
              key={phase.name}
              className={cn("rounded-xl border border-l-4 border-slate-200 bg-white shadow-sm overflow-hidden", colors.border)}
            >
              <div className={cn("px-5 py-3.5 border-b border-slate-100", colors.bg)}>
                <div className="flex items-center justify-between">
                  <h3 className={cn("font-semibold text-sm", colors.text)}>{phase.name}</h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", colors.badge)}>
                    {phase.duration_minutes} min
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {phase.activities.map((activity, idx) => (
                  <ActivityCard key={idx} activity={activity} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment */}
      {plan.equipment_list.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">Equipment List</h3>
          <div className="flex flex-wrap gap-2">
            {plan.equipment_list.map((item) => (
              <span key={item} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safety notes */}
      {plan.safety_notes.length > 0 && (
        <div className="space-y-2 mb-6">
          {plan.safety_notes.map((note, idx) => (
            <div key={idx} className="bg-safety-50 border border-safety-100 rounded-lg px-4 py-3 flex items-start gap-2">
              <AlertTriangle size={15} className="text-safety-600 shrink-0 mt-0.5" />
              <p className="text-sm text-safety-700">{note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coaching cues */}
      {plan.coaching_cues.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
          <h3 className="font-semibold text-brand-900 mb-3">Coaching Cues</h3>
          <div className="space-y-2">
            {plan.coaching_cues.map((cue, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <ChevronRight size={15} className="text-brand-400 shrink-0 mt-0.5" />
                <p className="text-sm text-brand-800 italic">"{cue}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity }: { activity: PracticeActivity }) {
  return (
    <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-slate-900 text-sm">{activity.name}</h4>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className={cn("w-2 h-2 rounded-full inline-block", INTENSITY_DOT[activity.intensity])} title={`${activity.intensity} intensity`} />
          <span className="text-xs text-slate-500 capitalize">{activity.intensity}</span>
          <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600 font-medium">
            {activity.duration_minutes} min
          </span>
        </div>
      </div>

      {activity.ltad_component && (
        <span className="inline-block text-xs px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-medium mb-2">
          {activity.ltad_component}
        </span>
      )}

      <p className="text-sm text-slate-600 mb-3">{activity.description}</p>

      {activity.setup && (
        <div className="bg-slate-100 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Setup</p>
          <p className="text-xs text-slate-700">{activity.setup}</p>
        </div>
      )}

      {activity.coaching_points.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Coaching Points</p>
          <ul className="space-y-1">
            {activity.coaching_points.map((pt, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-brand-400 shrink-0" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activity.progressions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Progressions</p>
          <div className="grid grid-cols-2 gap-2">
            {activity.progressions.map((prog, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500 mb-0.5">{i === 0 ? "Before" : "After"}</p>
                <p className="text-xs text-slate-800">{prog}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
