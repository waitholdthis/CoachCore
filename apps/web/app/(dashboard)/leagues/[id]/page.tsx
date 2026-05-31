"use client";
import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, Zap, GitCompare, AlertTriangle, CheckCircle, FileText, Clock } from "lucide-react";
import { leaguesApi, ingestApi } from "@/lib/api";
import { SPORT_EMOJI, SPORT_COLORS, formatDate, formatCategory } from "@/lib/utils";

export default function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leaguesApi.get(id),
  });
  const { data: uploads } = useQuery({
    queryKey: ["uploads", id],
    queryFn: () => leaguesApi.uploads(id),
    enabled: !!id,
  });
  const { data: summary } = useQuery({
    queryKey: ["conflict-summary", id],
    queryFn: () => ingestApi.conflictSummary(id),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl"/>)}</div>;
  }
  if (!league) return <div className="text-slate-500">League not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{SPORT_EMOJI[league.sport]}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{league.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${SPORT_COLORS[league.sport]}`}>
                {league.sport}
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              {league.season && `${league.season} · `}
              {league.age_brackets_served.join(", ")}
              {league.governing_body && ` · ${league.governing_body}`}
            </p>
          </div>
        </div>
      </div>

      {/* Safety banner if unresolved safety conflicts */}
      {(summary?.safety_critical ?? 0) > 0 && (
        <div className="safety-banner">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <strong>{summary!.safety_critical} safety-critical conflicts</strong> require your review before game day.{" "}
            <Link href={`/dashboard/leagues/${id}/conflicts`} className="underline font-medium">
              Review now →
            </Link>
          </div>
        </div>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href={`/dashboard/leagues/${id}/quick-ref`}
          className="bg-brand-600 text-white rounded-xl p-5 hover:bg-brand-700 transition-colors group">
          <Zap size={24} className="mb-2" />
          <p className="font-semibold">Game-Day Quick Ref</p>
          <p className="text-brand-200 text-sm mt-1">Critical rules at a glance</p>
        </Link>
        <Link href={`/dashboard/leagues/${id}/upload`}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all group">
          <Upload size={24} className="mb-2 text-slate-600" />
          <p className="font-semibold text-slate-900">Upload Rulebook</p>
          <p className="text-slate-400 text-sm mt-1">PDF, image, or DOCX</p>
        </Link>
        <Link href={`/dashboard/leagues/${id}/conflicts`}
          className={`rounded-xl p-5 transition-all ${
            (summary?.pending_review ?? 0) > 0
              ? "bg-conflict-50 border border-conflict-200 hover:shadow-md"
              : "bg-white border border-slate-200 hover:shadow-md"
          }`}>
          {(summary?.pending_review ?? 0) > 0 ? (
            <AlertTriangle size={24} className="mb-2 text-conflict-600" />
          ) : (
            <CheckCircle size={24} className="mb-2 text-green-600" />
          )}
          <p className="font-semibold text-slate-900">Rule Conflicts</p>
          <p className="text-slate-500 text-sm mt-1">
            {summary?.pending_review ?? 0} pending review
          </p>
        </Link>
      </div>

      {/* Conflict summary */}
      {summary && summary.total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Conflict Overview</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total", value: summary.total, color: "text-slate-900" },
              { label: "Pending", value: summary.pending_review, color: "text-conflict-600" },
              { label: "Safety", value: summary.safety_critical, color: "text-safety-600" },
              { label: "Local Overrides", value: summary.local_overrides, color: "text-brand-600" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Uploaded Rulebooks</h2>
          <Link href={`/dashboard/leagues/${id}/upload`}
            className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
            <Upload size={14} /> Upload new
          </Link>
        </div>
        {!uploads || uploads.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
            <FileText size={32} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No rulebooks uploaded yet</p>
            <Link href={`/dashboard/leagues/${id}/upload`}
              className="text-brand-600 text-sm font-medium mt-2 inline-block hover:underline">
              Upload your league's rulebook
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map(u => <UploadRow key={u.id} upload={u} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadRow({ upload }: { upload: ReturnType<typeof leaguesApi.uploads> extends Promise<infer T> ? T[0] : never }) {
  const statusConfig = {
    pending: { color: "text-slate-500", icon: Clock, label: "Pending" },
    processing: { color: "text-brand-600", icon: Clock, label: "Processing..." },
    completed: { color: "text-green-600", icon: CheckCircle, label: "Completed" },
    failed: { color: "text-red-600", icon: AlertTriangle, label: "Failed" },
    partial: { color: "text-conflict-600", icon: AlertTriangle, label: "Partial" },
  }[upload.ingestion_status] ?? { color: "text-slate-500", icon: Clock, label: upload.ingestion_status };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
      <FileText size={24} className="text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{upload.original_filename}</p>
        <p className="text-xs text-slate-400 mt-0.5">Uploaded {formatDate(upload.uploaded_at)}</p>
      </div>
      <div className="text-right text-sm shrink-0">
        <div className={`flex items-center gap-1 ${statusConfig.color}`}>
          <StatusIcon size={14} />
          <span className="font-medium">{statusConfig.label}</span>
        </div>
        {upload.ingestion_status === "completed" && (
          <p className="text-slate-400 text-xs mt-0.5">
            {upload.rules_extracted} rules · {upload.conflict_count} conflicts
          </p>
        )}
      </div>
    </div>
  );
}
