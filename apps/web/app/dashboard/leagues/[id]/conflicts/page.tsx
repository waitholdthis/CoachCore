"use client";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Shield, CheckCircle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ingestApi, leaguesApi } from "@/lib/api";
import { CONFLICT_TYPE_LABELS, CONFLICT_TYPE_COLORS, formatCategory, formatDate } from "@/lib/utils";
import type { ConflictRecord } from "@/lib/types";

export default function ConflictsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [filter, setFilter] = useState<"all" | "pending" | "safety">("all");

  const { data: league } = useQuery({ queryKey: ["league", id], queryFn: () => leaguesApi.get(id) });
  const { data: conflicts, isLoading } = useQuery({
    queryKey: ["conflicts", id, filter],
    queryFn: () =>
      ingestApi.conflicts(id, {
        unresolved_only: filter === "pending",
        safety_only: filter === "safety",
      }),
    enabled: !!id,
  });

  const safetyCount = conflicts?.filter(c => c.safety_critical).length ?? 0;
  const pendingCount = conflicts?.filter(c => c.resolution === "PENDING_REVIEW").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/leagues/${id}`} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rule Conflicts</h1>
          <p className="text-slate-500 text-sm">{league?.name}</p>
        </div>
      </div>

      {safetyCount > 0 && (
        <div className="safety-banner">
          <Shield size={18} className="shrink-0" />
          <strong>{safetyCount} safety-critical conflict{safetyCount > 1 ? "s" : ""}</strong> — review immediately.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "safety"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "all" && `All (${conflicts?.length ?? 0})`}
            {f === "pending" && `Pending (${pendingCount})`}
            {f === "safety" && `Safety (${safetyCount})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)}
        </div>
      ) : conflicts?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No conflicts found</p>
          <p className="text-slate-400 text-sm mt-1">
            {filter !== "all" ? "Try changing the filter above" : "Upload a rulebook to detect conflicts"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts?.map(conflict => (
            <ConflictCard key={conflict.id} conflict={conflict} leagueId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConflictCard({ conflict, leagueId }: { conflict: ConflictRecord; leagueId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: ({ resolution }: { resolution: string }) =>
      ingestApi.resolveConflict(conflict.id, resolution, notes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conflicts", leagueId] });
      qc.invalidateQueries({ queryKey: ["conflict-summary", leagueId] });
      toast.success("Conflict resolved");
    },
  });

  const isPending = conflict.resolution === "PENDING_REVIEW";
  const isResolved = !isPending;

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
      conflict.safety_critical ? "border-safety-300" : "border-slate-200"
    }`}>
      {/* Header */}
      <div
        className={`p-4 cursor-pointer flex items-start gap-3 ${conflict.safety_critical ? "bg-safety-50" : ""}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-0.5">
          {conflict.safety_critical ? (
            <Shield size={18} className="text-safety-600" />
          ) : (
            <AlertTriangle size={18} className="text-conflict-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{formatCategory(conflict.baseline_rule.category)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${CONFLICT_TYPE_COLORS[conflict.conflict_type]}`}>
              {CONFLICT_TYPE_LABELS[conflict.conflict_type]}
            </span>
            {conflict.safety_critical && (
              <span className="text-xs bg-safety-100 text-safety-700 px-2 py-0.5 rounded-full font-medium">
                Safety Critical
              </span>
            )}
            {isResolved && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Resolved
              </span>
            )}
          </div>
          {conflict.flag_message && (
            <p className="text-sm text-slate-600 mt-1">{conflict.flag_message}</p>
          )}
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Standard Rule</p>
              <p className="text-sm text-slate-700">{conflict.baseline_rule.canonical_text}</p>
              <p className="text-xs text-slate-400 mt-2">{conflict.baseline_rule.governing_body_source ?? "Baseline"}</p>
            </div>
            <div className="bg-brand-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-brand-600 uppercase mb-2">Your League Rule</p>
              <p className="text-sm text-slate-700">{conflict.local_rule.canonical_text}</p>
              <p className="text-xs text-slate-400 mt-2">
                {conflict.local_rule.source_page
                  ? `Uploaded doc p.${conflict.local_rule.source_page}${conflict.local_rule.source_paragraph ? `, §${conflict.local_rule.source_paragraph}` : ""}`
                  : "Local rulebook"}
              </p>
            </div>
          </div>

          {/* Resolution */}
          {isPending && (
            <div className="space-y-3 pt-2">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes for this decision..."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => resolveMutation.mutate({ resolution: "LOCAL_OVERRIDES" })}
                  disabled={resolveMutation.isPending}
                  className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  Apply local rule
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ resolution: "BASELINE_APPLIES" })}
                  disabled={resolveMutation.isPending}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                >
                  Keep standard rule
                </button>
              </div>
            </div>
          )}

          {isResolved && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle size={16} />
              <span>
                Resolution: <strong>{conflict.resolution === "LOCAL_OVERRIDES" ? "Local rule applies" : "Standard rule applies"}</strong>
                {conflict.admin_notes && ` — ${conflict.admin_notes}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
