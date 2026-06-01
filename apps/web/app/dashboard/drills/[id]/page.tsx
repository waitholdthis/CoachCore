"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Users, Bookmark, BookmarkCheck, CheckCircle, ChevronRight } from "lucide-react";
import { drillsApi, savedApi } from "@/lib/api";
import type { Drill, SavedItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const difficultyBadge: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-purple-100 text-purple-700",
};

export default function DrillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    Promise.all([
      drillsApi.get(id),
      savedApi.list("drill"),
    ])
      .then(([d, saved]) => {
        setDrill(d);
        const match = saved.find((s) => s.item_id === id && s.item_type === "drill");
        setSavedItem(match ?? null);
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load drill"))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!drill) return;
    setSavingToggle(true);
    try {
      if (savedItem) {
        await savedApi.unsaveByItem("drill", drill.id);
        setSavedItem(null);
      } else {
        const result = await savedApi.save({ item_type: "drill", item_id: drill.id, title: drill.title });
        setSavedItem(result);
      }
    } catch {
      // silently ignore
    } finally {
      setSavingToggle(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="h-8 w-32 bg-slate-100 animate-pulse rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !drill) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link href="/dashboard/drills" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} /> Back to Drill Library
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error ?? "Drill not found"}
        </div>
      </div>
    );
  }

  const playerText =
    drill.player_count_min != null && drill.player_count_max != null
      ? `${drill.player_count_min}–${drill.player_count_max} players`
      : drill.player_count_min != null
      ? `${drill.player_count_min}+ players`
      : null;

  const halfway = Math.ceil(drill.progressions.length / 2);
  const easierProgressions = drill.progressions.slice(0, halfway);
  const harderProgressions = drill.progressions.slice(halfway);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link href="/dashboard/drills" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Drill Library
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-100 text-brand-700 capitalize">
              {drill.sport}
            </span>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", difficultyBadge[drill.difficulty] ?? "bg-slate-100 text-slate-600")}>
              {drill.difficulty}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
              <Clock size={11} /> {drill.duration_minutes} min
            </span>
            {playerText && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                <Users size={11} /> {playerText}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{drill.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{drill.skill_focus}</p>
        </div>
        <button
          onClick={toggleSave}
          disabled={savingToggle}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shrink-0",
            savedItem
              ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          {savedItem ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {savedItem ? "Saved" : "Save Drill"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Description */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-2">Description</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{drill.description}</p>
        </div>

        {/* Setup */}
        {drill.setup && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-2">Setup</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{drill.setup}</p>
          </div>
        )}

        {/* Instructions */}
        {drill.instructions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3">Instructions</h2>
            <ol className="space-y-2">
              {drill.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Coaching Points */}
        {drill.coaching_points.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-3">Coaching Points</h2>
            <ul className="space-y-2">
              {drill.coaching_points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progressions */}
        {drill.progressions.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Progressions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl border border-green-200 p-5">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <ChevronRight size={14} className="rotate-180" /> Easier
                </h3>
                <ul className="space-y-2">
                  {easierProgressions.map((p, i) => (
                    <li key={i} className="text-sm text-green-900 leading-relaxed">• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
                <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <ChevronRight size={14} /> Harder
                </h3>
                <ul className="space-y-2">
                  {harderProgressions.map((p, i) => (
                    <li key={i} className="text-sm text-purple-900 leading-relaxed">• {p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Equipment & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drill.equipment.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3">Equipment</h2>
              <div className="flex flex-wrap gap-2">
                {drill.equipment.map((item) => (
                  <span key={item} className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {drill.tags.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {drill.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
