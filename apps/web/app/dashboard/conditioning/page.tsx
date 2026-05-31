"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Activity, Trash2, Calendar, BarChart2 } from "lucide-react";
import { conditioningApi } from "@/lib/api";
import type { SCProgram } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PHASE_LABELS: Record<string, string> = {
  off_season: "Off Season",
  pre_season: "Pre Season",
  in_season: "In Season",
  post_season: "Post Season",
};

const PHASE_COLORS: Record<string, string> = {
  off_season: "bg-slate-100 text-slate-600",
  pre_season: "bg-blue-100 text-blue-700",
  in_season: "bg-green-100 text-green-700",
  post_season: "bg-amber-100 text-amber-700",
};

export default function ConditioningPage() {
  const [programs, setPrograms] = useState<SCProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    conditioningApi
      .list()
      .then(setPrograms)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load programs"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await conditioningApi.delete(id);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to delete program");
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">S&C Engine</h1>
          <p className="text-slate-500 text-sm mt-1">AI-generated strength & conditioning macrocycles built on LTAD principles</p>
        </div>
        <Link
          href="/dashboard/conditioning/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New Program
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Activity size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No S&C programs yet</p>
          <p className="text-slate-400 text-sm mb-6">Generate age-appropriate macrocycles that follow LTAD safety guidelines.</p>
          <Link
            href="/dashboard/conditioning/new"
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Generate with AI
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group relative"
            >
              <Link href={`/dashboard/conditioning/${prog.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 pr-8 line-clamp-2 group-hover:text-brand-700 transition-colors">
                    {prog.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium capitalize">
                    {prog.sport}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {prog.age_bracket}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_COLORS[prog.season_phase] ?? "bg-slate-100 text-slate-600"}`}>
                    {PHASE_LABELS[prog.season_phase] ?? prog.season_phase}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3 font-medium">LTAD: {prog.ltad_stage}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <BarChart2 size={12} />
                    {prog.weeks}w × {prog.days_per_week}d/wk
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(prog.created_at)}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(prog.id, prog.title)}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete program"
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
