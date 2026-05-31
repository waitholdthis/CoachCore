"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Plus, X } from "lucide-react";
import { gameplanApi } from "@/lib/api";
import type { FieldPosition } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPORTS = [
  { value: "soccer", label: "Soccer" },
  { value: "basketball", label: "Basketball" },
  { value: "baseball", label: "Baseball" },
  { value: "football", label: "Football" },
  { value: "volleyball", label: "Volleyball" },
  { value: "other", label: "Other" },
];

const AGE_BRACKETS = [
  { value: "U6", label: "U6" },
  { value: "U8", label: "U8" },
  { value: "U10", label: "U10" },
  { value: "U12", label: "U12" },
  { value: "U14", label: "U14" },
  { value: "high_school", label: "High School" },
];

let tokenCounter = 1;

function generateId() {
  return `token-${Date.now()}-${tokenCounter++}`;
}

export default function NewGamePlanPage() {
  const router = useRouter();
  const fieldRef = useRef<SVGSVGElement>(null);

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("soccer");
  const [ageBracket, setAgeBracket] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [formation, setFormation] = useState("");
  const [tacticalNotes, setTacticalNotes] = useState("");
  const [positions, setPositions] = useState<FieldPosition[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addToken() {
    if (positions.length >= 11) return;
    const num = positions.length + 1;
    setPositions((prev) => [
      ...prev,
      {
        id: generateId(),
        player_name: `Player ${num}`,
        number: num,
        x: 20 + (num % 4) * 18,
        y: 20 + Math.floor(num / 4) * 20,
        position_label: "",
      },
    ]);
  }

  function removeToken(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }

  function handleFieldClick(e: React.MouseEvent<SVGSVGElement>) {
    if (dragging) return;
    if (positions.length >= 11) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const num = positions.length + 1;
    setPositions((prev) => [
      ...prev,
      { id: generateId(), player_name: `#${num}`, number: num, x, y, position_label: "" },
    ]);
  }

  function handleTokenMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDragging(id);

    const onMove = (me: MouseEvent) => {
      const svg = fieldRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, ((me.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((me.clientY - rect.top) / rect.height) * 100));
      setPositions((prev) => prev.map((p) => p.id === id ? { ...p, x, y } : p));
    };

    const onUp = () => {
      setDragging(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!ageBracket) {
      setError("Please select an age bracket.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const plan = await gameplanApi.create({
        title,
        sport,
        age_bracket: ageBracket,
        league_id: null,
        opponent_name: opponentName || null,
        formation: formation || null,
        field_positions: positions,
        tactical_notes: tacticalNotes || null,
        set_pieces: [],
      });
      router.push(`/dashboard/gameplan/${plan.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to create plan.");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/gameplan"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Back to Tactical Board
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Game Plan</h1>
        <p className="text-slate-500 text-sm mt-1">Place players on the tactical board, add formation and notes.</p>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Plan Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. vs Riverside FC — Week 6"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {SPORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Age Bracket</label>
              <select
                value={ageBracket}
                onChange={(e) => setAgeBracket(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Select…</option>
                {AGE_BRACKETS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Opponent (optional)</label>
              <input
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Opponent team name"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Formation (optional)</label>
              <input
                type="text"
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                placeholder="e.g. 4-3-3"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Tactical Board */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Tactical Board</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {positions.length}/11 players · Click field to place, drag to move
              </span>
              <button
                type="button"
                onClick={addToken}
                disabled={positions.length >= 11}
                className="text-xs bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={12} /> Add Player
              </button>
            </div>
          </div>

          {/* SVG Field */}
          <svg
            ref={fieldRef}
            viewBox="0 0 500 320"
            className="w-full rounded-xl cursor-crosshair select-none"
            style={{ background: "#16a34a" }}
            onClick={handleFieldClick}
          >
            {/* Field outline */}
            <rect x="10" y="10" width="480" height="300" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
            {/* Centre line */}
            <line x1="250" y1="10" x2="250" y2="310" stroke="white" strokeWidth="1.5" opacity="0.7" />
            {/* Centre circle */}
            <circle cx="250" cy="160" r="40" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
            <circle cx="250" cy="160" r="2" fill="white" opacity="0.9" />
            {/* Left penalty box */}
            <rect x="10" y="95" width="80" height="130" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
            <rect x="10" y="120" width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
            {/* Right penalty box */}
            <rect x="410" y="95" width="80" height="130" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
            <rect x="450" y="120" width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
            {/* Goals */}
            <rect x="0" y="132" width="10" height="56" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8" />
            <rect x="490" y="132" width="10" height="56" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8" />
            {/* Penalty spots */}
            <circle cx="70" cy="160" r="2" fill="white" opacity="0.8" />
            <circle cx="430" cy="160" r="2" fill="white" opacity="0.8" />

            {/* Player tokens */}
            {positions.map((pos) => {
              const cx = (pos.x / 100) * 500;
              const cy = (pos.y / 100) * 320;
              return (
                <g
                  key={pos.id}
                  onMouseDown={(e) => handleTokenMouseDown(e, pos.id)}
                  style={{ cursor: dragging === pos.id ? "grabbing" : "grab" }}
                >
                  <circle cx={cx} cy={cy} r="16" fill="#0369a1" stroke="white" strokeWidth="2" />
                  <text
                    x={cx}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {pos.number ?? "?"}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Player list */}
          {positions.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {positions.map((pos) => (
                <div key={pos.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-brand-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {pos.number}
                  </div>
                  <input
                    type="text"
                    value={pos.player_name}
                    onChange={(e) => setPositions((prev) => prev.map((p) => p.id === pos.id ? { ...p, player_name: e.target.value } : p))}
                    className="flex-1 text-xs bg-transparent focus:outline-none text-slate-700 min-w-0"
                    placeholder="Player name"
                  />
                  <button
                    type="button"
                    onClick={() => removeToken(pos.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tactical Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Tactical Notes</label>
          <textarea
            value={tacticalNotes}
            onChange={(e) => setTacticalNotes(e.target.value)}
            placeholder="High press from minute 1, press triggers on GK…"
            rows={4}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "w-full py-3 rounded-xl text-sm font-semibold transition-all",
            submitting
              ? "bg-brand-400 text-white cursor-not-allowed"
              : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md"
          )}
        >
          {submitting ? "Saving…" : "Save Game Plan"}
        </button>
      </form>
    </div>
  );
}
