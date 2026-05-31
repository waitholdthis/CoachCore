"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Dumbbell, Trash2, Clock, Calendar } from "lucide-react";
import { practiceApi } from "@/lib/api";
import type { PracticePlan } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

export default function PracticePage() {
  const [plans, setPlans] = useState<PracticePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    practiceApi
      .list()
      .then(setPlans)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load practice plans"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await practiceApi.delete(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to delete plan");
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Practice Builder</h1>
          <p className="text-slate-500 text-sm mt-1">AI-generated session plans aligned to LTAD guidelines</p>
        </div>
        <Link
          href="/dashboard/practice/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New Session
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
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Dumbbell size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No practice plans yet</p>
          <p className="text-slate-400 text-sm mb-6">Generate AI-powered session plans tailored to your team's age and sport.</p>
          <Link
            href="/dashboard/practice/new"
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Generate with AI
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group relative"
            >
              <Link href={`/dashboard/practice/${plan.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 pr-8 line-clamp-2 group-hover:text-brand-700 transition-colors">
                    {plan.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium capitalize">
                    {plan.sport}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {plan.age_bracket}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3 line-clamp-1">{plan.focus_area}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {plan.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(plan.created_at)}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(plan.id, plan.title)}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete plan"
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
