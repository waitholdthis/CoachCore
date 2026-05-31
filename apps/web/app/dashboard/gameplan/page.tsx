"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Map, Trash2, Calendar, Users } from "lucide-react";
import { gameplanApi } from "@/lib/api";
import type { GamePlan } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function GamePlanPage() {
  const [plans, setPlans] = useState<GamePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gameplanApi
      .list()
      .then(setPlans)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load game plans"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await gameplanApi.delete(id);
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
          <h1 className="text-2xl font-bold text-slate-900">Tactical Board</h1>
          <p className="text-slate-500 text-sm mt-1">Interactive game plans with formation diagrams and tactical notes</p>
        </div>
        <Link
          href="/dashboard/gameplan/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New Plan
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
          <Map size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No game plans yet</p>
          <p className="text-slate-400 text-sm mb-6">Build tactical formations with an interactive field diagram and notes.</p>
          <Link
            href="/dashboard/gameplan/new"
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Create Game Plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group relative"
            >
              <Link href={`/dashboard/gameplan/${plan.id}`} className="block">
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
                  {plan.formation && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      {plan.formation}
                    </span>
                  )}
                </div>
                {plan.opponent_name && (
                  <p className="text-sm text-slate-500 mb-3 flex items-center gap-1.5">
                    <Users size={13} />
                    vs {plan.opponent_name}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar size={12} />
                  {formatDate(plan.created_at)}
                  {plan.field_positions.length > 0 && (
                    <span className="ml-2">{plan.field_positions.length} players placed</span>
                  )}
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
