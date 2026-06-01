"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, BarChart2, CalendarDays } from "lucide-react";
import { seasonsApi } from "@/lib/api";
import type { Season } from "@/lib/types";
import { cn } from "@/lib/utils";

function progressPercent(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seasonsApi
      .list()
      .then(setSeasons)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load seasons"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Season Planning</h1>
          <p className="text-slate-500 text-sm mt-1">Map out your full season arc week by week</p>
        </div>
        <Link
          href="/dashboard/seasons/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New Season
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : seasons.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <BarChart2 size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No seasons yet</p>
          <p className="text-slate-400 text-sm mb-6">Create a season plan to map out your weekly themes and focus areas.</p>
          <Link
            href="/dashboard/seasons/new"
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Create Season Plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasons.map((season) => {
            const pct = progressPercent(season.start_date, season.end_date);
            return (
              <Link
                key={season.id}
                href={`/dashboard/seasons/${season.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-100 text-brand-700 capitalize">
                    {season.sport}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                    {season.age_bracket}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-brand-700 transition-colors">
                  {season.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                  <CalendarDays size={12} />
                  {formatDateRange(season.start_date, season.end_date)}
                  <span className="text-slate-300 mx-1">·</span>
                  {season.total_weeks} weeks
                </p>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Season progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-400" : "bg-brand-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
