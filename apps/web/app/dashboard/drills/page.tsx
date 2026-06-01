"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, BookOpen, Clock, Users, ChevronRight } from "lucide-react";
import { drillsApi } from "@/lib/api";
import type { Drill } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPORTS = ["All", "Soccer", "Basketball", "Baseball", "Football", "Volleyball"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

const difficultyBadge: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-purple-100 text-purple-700",
};

function DrillCard({ drill }: { drill: Drill }) {
  const playerText =
    drill.player_count_min != null && drill.player_count_max != null
      ? `${drill.player_count_min}–${drill.player_count_max} players`
      : drill.player_count_min != null
      ? `${drill.player_count_min}+ players`
      : null;

  return (
    <Link
      href={`/dashboard/drills/${drill.id}`}
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-100 text-brand-700 capitalize">
            {drill.sport}
          </span>
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", difficultyBadge[drill.difficulty] ?? "bg-slate-100 text-slate-600")}>
            {drill.difficulty}
          </span>
        </div>
      </div>
      <h3 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-brand-700 transition-colors line-clamp-2">
        {drill.title}
      </h3>
      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{drill.skill_focus}</p>
      <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {drill.duration_minutes} min
          </span>
          {playerText && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {playerText}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-brand-600 font-medium text-xs">
          View Drill <ChevronRight size={12} />
        </span>
      </div>
    </Link>
  );
}

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [featured, setFeatured] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  useEffect(() => {
    drillsApi.featured().then(setFeatured).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Parameters<typeof drillsApi.list>[0] = {};
    if (search) params.search = search;
    if (sport !== "All") params.sport = sport.toLowerCase();
    if (difficulty !== "All") params.difficulty = difficulty.toLowerCase();

    drillsApi
      .list(params)
      .then(setDrills)
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load drills"))
      .finally(() => setLoading(false));
  }, [search, sport, difficulty]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drill Library</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and filter coach-tested drills by sport, difficulty, and skill focus</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          />
        </div>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {SPORTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Featured section */}
      {featured.length > 0 && !search && sport === "All" && difficulty === "All" && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Featured Drills</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {featured.slice(0, 4).map((drill) => (
              <div key={drill.id} className="min-w-[220px] max-w-[240px] flex-shrink-0">
                <DrillCard drill={drill} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : drills.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No drills found</p>
          <p className="text-slate-400 text-sm">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{drills.length} drill{drills.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drills.map((drill) => (
              <DrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
