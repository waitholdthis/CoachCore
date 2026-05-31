"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leaguesApi } from "@/lib/api";
import { AGE_BRACKETS, DIVISION_TYPES } from "@/lib/utils";
import type { Sport } from "@/lib/types";

const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: "soccer", label: "Soccer", emoji: "⚽" },
  { value: "baseball", label: "Baseball", emoji: "⚾" },
  { value: "basketball", label: "Basketball", emoji: "🏀" },
  { value: "football", label: "Football", emoji: "🏈" },
];

export default function NewLeaguePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    sport: "" as Sport,
    season: "",
    governing_body: "",
    contact_admin: "",
    age_brackets_served: [] as string[],
    division_types_served: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: leaguesApi.create,
    onSuccess: (league) => {
      qc.invalidateQueries({ queryKey: ["leagues"] });
      toast.success("League created!");
      router.push(`/dashboard/leagues/${league.id}`);
    },
    onError: () => toast.error("Failed to create league"),
  });

  function toggleArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.sport) {
      toast.error("Name and sport are required");
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New League</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sport selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Sport *</label>
          <div className="grid grid-cols-2 gap-3">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, sport: s.value }))}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  form.sport === s.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">League Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Springfield Youth Hoops 2026"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Season */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Season</label>
            <input
              type="text"
              value={form.season}
              onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
              placeholder="e.g. Spring 2026"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Governing Body</label>
            <input
              type="text"
              value={form.governing_body}
              onChange={e => setForm(f => ({ ...f, governing_body: e.target.value }))}
              placeholder="e.g. AYSO, Little League"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Age brackets */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Age Brackets Served</label>
          <div className="flex flex-wrap gap-2">
            {AGE_BRACKETS.map((ab) => (
              <button
                key={ab}
                type="button"
                onClick={() => setForm(f => ({ ...f, age_brackets_served: toggleArray(f.age_brackets_served, ab) }))}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                  form.age_brackets_served.includes(ab)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-brand-400"
                }`}
              >
                {ab}
              </button>
            ))}
          </div>
        </div>

        {/* Division types */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Division Types</label>
          <div className="flex flex-wrap gap-2">
            {DIVISION_TYPES.map((dt) => (
              <button
                key={dt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, division_types_served: toggleArray(f.division_types_served, dt.value) }))}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                  form.division_types_served.includes(dt.value)
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-500"
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Admin Contact (optional)</label>
          <input
            type="text"
            value={form.contact_admin}
            onChange={e => setForm(f => ({ ...f, contact_admin: e.target.value }))}
            placeholder="email or phone"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating..." : "Create League"}
        </button>
      </form>
    </div>
  );
}
