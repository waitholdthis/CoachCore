"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Save, ChevronDown, ChevronUp, Users } from "lucide-react";
import { gameplanApi } from "@/lib/api";
import type { GamePlan, FieldPosition } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function GamePlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const fieldRef = useRef<SVGSVGElement>(null);

  const [plan, setPlan] = useState<GamePlan | null>(null);
  const [positions, setPositions] = useState<FieldPosition[]>([]);
  const [tacticalNotes, setTacticalNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useEffect(() => {
    gameplanApi
      .get(id)
      .then((data) => {
        setPlan(data);
        setPositions(data.field_positions ?? []);
        setTacticalNotes(data.tactical_notes ?? "");
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load plan"))
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(
    async (updatedPositions?: FieldPosition[], updatedNotes?: string) => {
      setSaving(true);
      setSaved(false);
      try {
        await gameplanApi.update(id, {
          field_positions: updatedPositions ?? positions,
          tactical_notes: updatedNotes ?? tacticalNotes,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } }; message?: string };
        setError(err?.response?.data?.detail ?? err?.message ?? "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [id, positions, tacticalNotes]
  );

  function handleTokenMouseDown(e: React.MouseEvent, tokenId: string) {
    e.stopPropagation();
    setDragging(tokenId);

    const onMove = (me: MouseEvent) => {
      const svg = fieldRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, ((me.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((me.clientY - rect.top) / rect.height) * 100));
      setPositions((prev) => prev.map((p) => p.id === tokenId ? { ...p, x, y } : p));
    };

    const onUp = () => {
      setDragging(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      // Auto-save after drag
      setPositions((prev) => {
        save(prev);
        return prev;
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error ?? "Plan not found"}
        </div>
        <Link href="/dashboard/gameplan" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mt-4">
          <ArrowLeft size={15} /> Back to Tactical Board
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/gameplan" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Back to Tactical Board
        </Link>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 font-medium">Saved</span>}
          <button
            onClick={() => save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Title + meta */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{plan.title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 font-medium capitalize">{plan.sport}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{plan.age_bracket}</span>
          {plan.formation && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">{plan.formation}</span>
          )}
          {plan.opponent_name && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
              <Users size={10} /> vs {plan.opponent_name}
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto self-center">Updated {formatDate(plan.updated_at)}</span>
        </div>
      </div>

      {/* Tactical Board */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Tactical Board</h2>
          <span className="text-xs text-slate-400">Drag players to reposition · auto-saves on drop</span>
        </div>

        <svg
          ref={fieldRef}
          viewBox="0 0 500 320"
          className="w-full rounded-xl select-none"
          style={{ background: "#16a34a" }}
        >
          <rect x="10" y="10" width="480" height="300" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
          <line x1="250" y1="10" x2="250" y2="310" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <circle cx="250" cy="160" r="40" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <circle cx="250" cy="160" r="2" fill="white" opacity="0.9" />
          <rect x="10" y="95" width="80" height="130" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <rect x="10" y="120" width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          <rect x="410" y="95" width="80" height="130" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />
          <rect x="450" y="120" width="40" height="80" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          <rect x="0" y="132" width="10" height="56" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <rect x="490" y="132" width="10" height="56" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8" />
          <circle cx="70" cy="160" r="2" fill="white" opacity="0.8" />
          <circle cx="430" cy="160" r="2" fill="white" opacity="0.8" />

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
                  x={cx} y={cy + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="11" fontWeight="bold"
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {pos.number ?? "?"}
                </text>
                {pos.position_label && (
                  <text
                    x={cx} y={cy + 24}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="8" opacity="0.9"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {pos.position_label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {positions.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-3">No players placed on this plan.</p>
        )}
      </div>

      {/* Tactical Notes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
        <h2 className="font-semibold text-slate-900 mb-3">Tactical Notes</h2>
        <textarea
          value={tacticalNotes}
          onChange={(e) => setTacticalNotes(e.target.value)}
          onBlur={() => save(undefined, tacticalNotes)}
          placeholder="Add tactical notes — press triggers, set piece instructions, opponent weaknesses…"
          rows={5}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">Auto-saves when you click away</p>
      </div>

      {/* Key Rules Context */}
      {plan.key_rules_context && plan.key_rules_context.length > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl overflow-hidden mb-5">
          <button
            onClick={() => setRulesExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-brand-800 hover:bg-brand-100 transition-colors"
          >
            <span>Key Rules Context ({plan.key_rules_context.length} rules)</span>
            {rulesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {rulesExpanded && (
            <div className="px-5 pb-4 space-y-2">
              {(plan.key_rules_context as Record<string, unknown>[]).map((rule, i) => (
                <div key={i} className="bg-white rounded-lg border border-brand-100 p-3 text-xs text-slate-600">
                  {typeof rule === "string" ? rule : JSON.stringify(rule)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
