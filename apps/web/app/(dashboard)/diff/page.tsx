"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GitCompare, AlertTriangle, Shield, ArrowRight, Loader2 } from "lucide-react";
import { diffApi, leaguesApi } from "@/lib/api";
import { AGE_BRACKETS, DIVISION_TYPES, SPORT_EMOJI, DIFF_TYPE_COLORS, formatCategory } from "@/lib/utils";
import type { RuleDiff, DiffEntry, Sport } from "@/lib/types";

const SPORTS: Sport[] = ["soccer", "baseball", "basketball", "football"];

function ContextForm({
  label,
  value,
  onChange,
  leagues,
}: {
  label: string;
  value: { sport: Sport; age_bracket: string; division_type: string; league_id: string; label: string };
  onChange: (v: typeof value) => void;
  leagues: Array<{ id: string; name: string; sport: Sport }>;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
      <h3 className="font-semibold text-slate-900">{label}</h3>
      <input
        placeholder={`Label (e.g. "${label} League")`}
        value={value.label}
        onChange={e => onChange({ ...value, label: e.target.value })}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <select value={value.sport} onChange={e => onChange({ ...value, sport: e.target.value as Sport })}
          className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {SPORTS.map(s => <option key={s} value={s}>{SPORT_EMOJI[s]} {s}</option>)}
        </select>
        <select value={value.age_bracket} onChange={e => onChange({ ...value, age_bracket: e.target.value })}
          className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Age bracket...</option>
          {AGE_BRACKETS.map(ab => <option key={ab} value={ab}>{ab}</option>)}
        </select>
        <select value={value.division_type} onChange={e => onChange({ ...value, division_type: e.target.value })}
          className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Division...</option>
          {DIVISION_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
        </select>
        <select value={value.league_id} onChange={e => onChange({ ...value, league_id: e.target.value })}
          className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">No league</option>
          {leagues.filter(l => l.sport === value.sport).map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const DIFF_TYPE_LABELS: Record<DiffEntry["diff_type"], string> = {
  MORE_RESTRICTIVE: "More Restrictive Away",
  MORE_PERMISSIVE: "More Permissive Away",
  FUNDAMENTALLY_DIFFERENT: "Fundamentally Different",
  MISSING_IN_AWAY: "Only in Home",
  MISSING_IN_HOME: "Only in Away",
};

export default function DiffPage() {
  const [home, setHome] = useState({
    sport: "soccer" as Sport,
    age_bracket: "U10",
    division_type: "recreational",
    league_id: "",
    label: "My League",
  });
  const [away, setAway] = useState({
    sport: "soccer" as Sport,
    age_bracket: "U10",
    division_type: "recreational",
    league_id: "",
    label: "Away Tournament",
  });

  const { data: leagues } = useQuery({ queryKey: ["leagues"], queryFn: () => leaguesApi.list() });

  const diffMutation = useMutation({
    mutationFn: () => diffApi.generate({ home, away }),
  });

  const diff: RuleDiff | undefined = diffMutation.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rule Diff Generator</h1>
        <p className="text-slate-500 text-sm mt-1">
          Traveling to a tournament? See exactly which rules change between your home league and the away location.
        </p>
      </div>

      {/* Context inputs */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <ContextForm label="Home" value={home} onChange={setHome} leagues={leagues ?? []} />
        <div className="flex items-center justify-center pt-16">
          <div className="bg-slate-100 rounded-full p-2">
            <ArrowRight size={20} className="text-slate-400" />
          </div>
        </div>
        <div className="-mt-4">
          <ContextForm label="Away" value={away} onChange={setAway} leagues={leagues ?? []} />
        </div>
      </div>

      <button
        onClick={() => diffMutation.mutate()}
        disabled={diffMutation.isPending || !home.age_bracket || !away.age_bracket}
        className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {diffMutation.isPending ? (
          <><Loader2 size={18} className="animate-spin" /> Comparing rules...</>
        ) : (
          <><GitCompare size={18} /> Generate Rule Diff</>
        )}
      </button>

      {/* Results */}
      {diff && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{diff.total_differences}</p>
              <p className="text-xs text-slate-500">Total differences</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${diff.safety_critical_differences > 0 ? "text-safety-600" : "text-green-600"}`}>
                {diff.safety_critical_differences}
              </p>
              <p className="text-xs text-slate-500">Safety critical</p>
            </div>
            <div className="ml-auto text-sm text-slate-500">
              <span className="font-medium text-slate-700">{diff.home.label}</span>
              {" → "}
              <span className="font-medium text-slate-700">{diff.away.label}</span>
            </div>
          </div>

          {diff.safety_critical_differences > 0 && (
            <div className="safety-banner">
              <Shield size={16} className="shrink-0" />
              <strong>{diff.safety_critical_differences} safety-critical rule differences</strong> — review before game day.
            </div>
          )}

          {diff.entries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              No differences found between these two rule contexts.
            </div>
          ) : (
            diff.entries.map((entry, i) => <DiffCard key={i} entry={entry} home={diff.home.label} away={diff.away.label} />)
          )}
        </div>
      )}
    </div>
  );
}

function DiffCard({
  entry,
  home,
  away,
}: {
  entry: DiffEntry;
  home: string;
  away: string;
}) {
  return (
    <div className={`diff-card border-l-4 ${DIFF_TYPE_COLORS[entry.diff_type]}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {entry.safety_critical && (
          <Shield size={14} className="text-safety-600" />
        )}
        <span className="font-semibold text-slate-900">{formatCategory(entry.category)}</span>
        {entry.subcategory && (
          <span className="text-xs text-slate-400">/ {formatCategory(entry.subcategory)}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
          entry.diff_type === "MORE_RESTRICTIVE" ? "bg-blue-100 text-blue-700" :
          entry.diff_type === "MORE_PERMISSIVE" ? "bg-yellow-100 text-yellow-700" :
          entry.diff_type === "FUNDAMENTALLY_DIFFERENT" ? "bg-red-100 text-red-700" :
          "bg-slate-100 text-slate-600"
        }`}>
          {DIFF_TYPE_LABELS[entry.diff_type]}
        </span>
      </div>

      {entry.key_difference && (
        <p className="text-sm text-slate-600 mb-3 italic">"{entry.key_difference}"</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {entry.home_rule_text ? (
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 mb-1">{home.toUpperCase()}</p>
            <p className="text-xs text-slate-700">{entry.home_rule_text}</p>
            {entry.home_rule_source && (
              <p className="text-xs text-slate-400 mt-1">— {entry.home_rule_source}</p>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
            No rule for this category
          </div>
        )}
        {entry.away_rule_text ? (
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-400 mb-1">{away.toUpperCase()}</p>
            <p className="text-xs text-slate-700">{entry.away_rule_text}</p>
            {entry.away_rule_source && (
              <p className="text-xs text-slate-400 mt-1">— {entry.away_rule_source}</p>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
            No rule for this category
          </div>
        )}
      </div>
    </div>
  );
}
