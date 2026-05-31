"use client";

import { useState } from "react";
import { FileText, Film, Trash2, Flag, Play } from "lucide-react";
import type { Upload } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";
import { uploadsApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  upload: Upload;
  isCoachOrAdmin: boolean;
  onDeleted: (id: string) => void;
}

export default function UploadCard({ upload, isCoachOrAdmin, onDeleted }: Props) {
  const currentUser = getUser();
  const canDelete =
    upload.uploader_id === currentUser?.id || isCoachOrAdmin;
  const [showActions, setShowActions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Touch long-press
  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  function handleTouchStart() {
    pressTimer = setTimeout(() => setShowActions(true), 500);
  }

  function handleTouchEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setShowActions((prev) => !prev);
  }

  async function handleDelete() {
    try {
      await uploadsApi.deleteUpload(upload.id);
      onDeleted(upload.id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setShowActions(false);
  }

  async function handleReport() {
    try {
      await uploadsApi.report(upload.id, "Inappropriate content");
      toast.success("Reported");
    } catch {
      toast.error("Failed to report");
    }
    setShowActions(false);
  }

  if (upload.file_type === "photo") {
    return (
      <>
        <div
          className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => !showActions && setLightboxOpen(true)}
        >
          <img
            src={upload.thumbnail_url ?? upload.url}
            alt={upload.caption ?? upload.original_filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute inset-0 bg-black/50 z-20 flex flex-col items-center justify-center gap-2">
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 bg-white text-danger-500 rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={handleReport}
                  className="flex items-center gap-2 bg-white text-amber-600 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={upload.url}
              alt={upload.caption ?? upload.original_filename}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </>
    );
  }

  if (upload.file_type === "video") {
    return (
      <div
        className="relative aspect-square bg-gray-800 rounded-xl overflow-hidden cursor-pointer"
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {upload.thumbnail_url ? (
          <img
            src={upload.thumbnail_url}
            alt={upload.caption ?? upload.original_filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-gray-900 ml-0.5" />
          </div>
        </div>

        {showActions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowActions(false)}
            />
            <div className="absolute inset-0 bg-black/50 z-20 flex flex-col items-center justify-center gap-2">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-white text-danger-500 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Document
  const ext = upload.original_filename.split(".").pop()?.toLowerCase() ?? "";
  const iconColor =
    ext === "pdf"
      ? "text-danger-500 bg-danger-50"
      : ["doc", "docx"].includes(ext)
      ? "text-brand-500 bg-brand-50"
      : "text-gray-500 bg-gray-100";

  return (
    <div
      className="upload-card relative flex items-center gap-3 p-3"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColor)}>
        <FileText className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {upload.original_filename}
        </p>
        <p className="text-xs text-gray-400">
          {formatFileSize(upload.file_size)} · {ext.toUpperCase()}
        </p>
      </div>
      <a
        href={upload.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-500 text-xs font-medium shrink-0"
      >
        Open
      </a>

      {showActions && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowActions(false)}
          />
          <div className="absolute right-4 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-3 text-danger-500 text-sm font-medium hover:bg-danger-50 transition-colors w-full"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
