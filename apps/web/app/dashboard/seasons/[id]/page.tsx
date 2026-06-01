"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Plus, X, Save } from "lucide-react";
import { seasonsApi, practiceApi } from "@/lib/api";
import type { Season, SeasonWeek, PracticePlan } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const WEEK_PALETTE = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-amber-50 border-amber-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
  "bg-cyan-50 border-cyan-200",
];

interface WeekCardProps {
  week: SeasonWeek;
  plans: PracticePlan[];
  onSave: (weekNumber: number, patch: Partial<SeasonWeek>) => Promise<void>;
  colorClass: string;
}

function WeekCard({ week, plans, onSave, colorClass }: WeekCardProps) {
  const [theme, setTheme] = useState(week.theme ?? "");
  const [skills, setSkills] = useState<string[]>(week.focus_skills);
  const [notes, setNotes] = useState(week.notes ?? "");
  const [linkedPlan, setLinkedPlan] = useState(week.linked_plan_id ?? "");
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(week.week_number, {
      theme: theme || null,
      focus_skills: skills,
      notes: notes || null,
      linked_plan_id: linkedPlan || null,
    });
    setSaving(false);
  }

  function addSkill() {
    if (!newSkill.trim()) return;
    setSkills((s) => [...s, newSkill.trim()]);
    setNewSkill("");
  }

  function removeSkill(i: number) {
    setSkills((s) => s.filter((_, idx) => idx !== i));
  }

  return (
    <div className={cn("rounded-xl border p-4", colorClass)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-slate-400 leading-none">{week.week_number}</span>
          <span className="text-xs text-slate-500 font-medium">WEEK</span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-medium transition-colors disabled:opacity-50"
        >
          <Save size={11} />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Theme */}
      <div className="mb-3">
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onBlur={save}
          className="w-full bg-white/60 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400"
          placeholder="Week theme…"
        />
      </div>

      {/* Focus Skills */}
      <div className="mb-3">
        <p className="text-xs font-medium text-slate-500 mb-1.5">Focus Skills</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {skills.map((skill, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
              {skill}
              <button onClick={() => removeSkill(i)} className="text-slate-400 hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            className="flex-1 bg-white/60 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-slate-400"
            placeholder="Add skill…"
          />
          <button
            onClick={addSkill}
            className="p-1.5 bg-white/80 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-3">
        <p className="text-xs font-medium text-slate-500 mb-1.5">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={save}
          rows={2}
          className="w-full bg-white/60 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none placeholder:text-slate-400"
          placeholder="Optional notes…"
        />
      </div>

      {/* Linked plan */}
      {plans.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">Linked Practice Plan</p>
          <select
            value={linkedPlan}
            onChange={(e) => { setLinkedPlan(e.target.value); }}
            className="w-full bg-white/60 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">None</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [season, setSeason] = useState<Season | null>(null);
  const [weeks, setWeeks] = useState<SeasonWeek[]>([]);
  const [plans, setPlans] = useState<PracticePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      seasonsApi.get(id),
      seasonsApi.weeks(id),
      practiceApi.list(),
    ])
      .then(([s, w, p]) => {
        setSeason(s);
        setWeeks(w);
        setPlans(p);
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load season"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleWeekSave(weekNumber: number, patch: Partial<SeasonWeek>) {
    const updated = await seasonsApi.updateWeek(id, weekNumber, patch);
    setWeeks((prev) => prev.map((w) => w.week_number === weekNumber ? updated : w));
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="h-8 w-32 bg-slate-100 animate-pulse rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link href="/dashboard/seasons" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error ?? "Season not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/dashboard/seasons" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Season Planning
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-brand-100 text-brand-700 capitalize">
            {season.sport}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
            {season.age_bracket}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
            <CalendarDays size={11} /> {season.total_weeks} weeks
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{season.title}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {formatDate(season.start_date)} – {formatDate(season.end_date)}
        </p>
        {season.description && (
          <p className="text-slate-600 text-sm mt-3 max-w-2xl">{season.description}</p>
        )}
        {season.goals.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {season.goals.map((g, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Week grid */}
      {weeks.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No weeks found for this season.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              plans={plans}
              onSave={handleWeekSave}
              colorClass={WEEK_PALETTE[(week.week_number - 1) % WEEK_PALETTE.length]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
