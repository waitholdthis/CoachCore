"use client";
import { use, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ingestApi, leaguesApi } from "@/lib/api";
import { AGE_BRACKETS, DIVISION_TYPES } from "@/lib/utils";
import type { RuleUpload } from "@/lib/types";

export default function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: league } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leaguesApi.get(id),
  });

  const [sport, setSport] = useState(league?.sport ?? "soccer");
  const [ageBracket, setAgeBracket] = useState("");
  const [uploadResult, setUploadResult] = useState<RuleUpload | null>(null);
  const [pollingUploadId, setPollingUploadId] = useState<string | null>(null);

  // Poll for upload status
  const { data: statusData } = useQuery({
    queryKey: ["upload-status", pollingUploadId],
    queryFn: () => ingestApi.status(pollingUploadId!),
    enabled: !!pollingUploadId,
    refetchInterval: (query) => {
      const status = query.state.data?.ingestion_status;
      return status === "processing" || status === "pending" ? 2000 : false;
    },
  });

  const currentUpload = statusData ?? uploadResult;

  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File }) =>
      ingestApi.upload(id, file, sport || league?.sport || "soccer", ageBracket),
    onSuccess: (upload) => {
      setUploadResult(upload);
      setPollingUploadId(upload.id);
      qc.invalidateQueries({ queryKey: ["uploads", id] });
      toast.success("Upload started — processing in background");
    },
    onError: () => toast.error("Upload failed"),
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) uploadMutation.mutate({ file: accepted[0] });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/tiff": [".tiff", ".tif"],
    },
    maxFiles: 1,
    disabled: uploadMutation.isPending,
  });

  const isProcessing = currentUpload?.ingestion_status === "processing" || currentUpload?.ingestion_status === "pending";
  const isCompleted = currentUpload?.ingestion_status === "completed";
  const isFailed = currentUpload?.ingestion_status === "failed";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/leagues/${id}`} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Upload Rulebook</h1>
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-900">Document Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Age Bracket *</label>
            <select
              value={ageBracket}
              onChange={e => setAgeBracket(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select bracket...</option>
              {AGE_BRACKETS.map(ab => <option key={ab} value={ab}>{ab}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sport</label>
            <div className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500">
              {league?.sport ?? "—"}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          These settings help the AI correctly extract and categorize rules from your document.
        </p>
      </div>

      {/* Drop zone */}
      {!currentUpload && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-brand-400 bg-brand-50"
              : "border-slate-300 hover:border-brand-300 hover:bg-slate-50"
          } ${uploadMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          {uploadMutation.isPending ? (
            <Loader2 size={40} className="mx-auto text-brand-500 animate-spin mb-4" />
          ) : (
            <Upload size={40} className="mx-auto text-slate-300 mb-4" />
          )}
          <p className="font-medium text-slate-700">
            {isDragActive ? "Drop your file here" : "Drag & drop your rulebook, or click to browse"}
          </p>
          <p className="text-sm text-slate-400 mt-1">PDF, PNG, JPEG, TIFF supported · Max 50MB</p>
        </div>
      )}

      {/* Processing status */}
      {currentUpload && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-slate-400" />
            <div>
              <p className="font-medium text-slate-900">{currentUpload.original_filename}</p>
              <p className="text-sm text-slate-400">
                {currentUpload.page_count ? `${currentUpload.page_count} pages` : "Processing..."}
              </p>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-600">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">Extracting and analyzing rules...</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                <span className="font-medium">Processing complete</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: "Rules Found", value: currentUpload.rules_extracted },
                  { label: "Conflicts", value: currentUpload.conflict_count },
                  { label: "Safety Flags", value: currentUpload.safety_flag_count },
                  { label: "Ambiguous", value: currentUpload.ambiguous_rule_count },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              {(currentUpload.ocr_confidence_avg ?? 1) < 0.90 && (
                <div className="conflict-banner">
                  <AlertTriangle size={16} />
                  <span>OCR quality: {Math.round((currentUpload.ocr_confidence_avg ?? 0) * 100)}% — some text may be inaccurate. Consider uploading a higher-quality scan.</span>
                </div>
              )}
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/leagues/${id}/conflicts`}
                  className="flex-1 bg-brand-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
                >
                  Review {currentUpload.conflict_count} conflicts
                </Link>
                <Link
                  href={`/dashboard/leagues/${id}/quick-ref`}
                  className="flex-1 bg-slate-100 text-slate-700 text-center py-2 rounded-lg text-sm font-medium hover:bg-slate-200"
                >
                  View Quick Ref
                </Link>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="safety-banner">
              <AlertTriangle size={16} className="shrink-0" />
              <div>
                <strong>Processing failed</strong>
                {currentUpload.error_message && (
                  <p className="text-xs mt-1">{currentUpload.error_message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500 space-y-1">
        <p className="font-medium text-slate-700">Tips for best results:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Native PDFs (with selectable text) process faster and more accurately than scans</li>
          <li>If uploading a photo of a printed rulebook, ensure good lighting and avoid shadows</li>
          <li>The AI extracts rules per page — a 20-page document takes ~60 seconds to process</li>
        </ul>
      </div>
    </div>
  );
}
