"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { uploadsApi, teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser } from "@/lib/auth";
import UploadCard from "@/components/uploads/UploadCard";
import { cn } from "@/lib/utils";
import type { FileType } from "@/lib/types";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
];

export default function UploadsPage() {
  const { team } = useActiveTeam();
  const currentUser = getUser();
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("");

  const { data: uploads, isLoading } = useQuery({
    queryKey: ["uploads", team?.id, filter, seasonFilter],
    queryFn: () =>
      uploadsApi.list(team!.id, {
        file_type: filter !== "all" ? filter : undefined,
        season_label: seasonFilter || undefined,
        limit: 100,
      }),
    enabled: !!team,
  });

  const { data: members } = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => teamsApi.members(team!.id),
    enabled: !!team,
  });

  const myMember = members?.find((m) => m.user_id === currentUser?.id);
  const isCoachOrAdmin =
    myMember?.role === "coach" || myMember?.role === "admin";

  // Get unique season labels
  const seasonLabels = [
    ...new Set(
      uploads
        ?.filter((u) => u.season_label)
        .map((u) => u.season_label as string) ?? []
    ),
  ];

  const photos = uploads?.filter((u) => u.file_type === "photo");
  const videos = uploads?.filter((u) => u.file_type === "video");
  const docs = uploads?.filter((u) => u.file_type === "document");

  function handleDeleted(id: string) {
    qc.setQueryData(
      ["uploads", team?.id, filter, seasonFilter],
      (old: typeof uploads) => old?.filter((u) => u.id !== id)
    );
  }

  if (!team) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-5xl mb-4">📸</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No team selected</h2>
        <p className="text-gray-500 text-sm">Join a team to see uploads</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Filter row */}
      <div className="px-4 pt-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                filter === value
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Season filter */}
      {seasonLabels.length > 1 && (
        <div className="px-4 mb-2">
          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All seasons</option>
            {seasonLabels.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="px-4 grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!uploads || uploads.length === 0) && (
        <div className="px-4 py-16 text-center">
          <div className="text-5xl mb-4">📷</div>
          <h3 className="font-semibold text-gray-900 mb-1">No uploads yet</h3>
          <p className="text-sm text-gray-500">
            Share photos, videos, or documents with your team
          </p>
        </div>
      )}

      {/* Photos grid */}
      {!isLoading && (filter === "all" || filter === "photo") && photos && photos.length > 0 && (
        <div className="px-4 mt-3">
          {filter === "all" && (
            <p className="section-header">Photos</p>
          )}
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((upload) => (
              <UploadCard
                key={upload.id}
                upload={upload}
                isCoachOrAdmin={isCoachOrAdmin}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Videos grid */}
      {!isLoading && (filter === "all" || filter === "video") && videos && videos.length > 0 && (
        <div className="px-4 mt-3">
          {filter === "all" && (
            <p className="section-header">Videos</p>
          )}
          <div className="grid grid-cols-3 gap-1.5">
            {videos.map((upload) => (
              <UploadCard
                key={upload.id}
                upload={upload}
                isCoachOrAdmin={isCoachOrAdmin}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents list */}
      {!isLoading && (filter === "all" || filter === "document") && docs && docs.length > 0 && (
        <div className="px-4 mt-3">
          {filter === "all" && (
            <p className="section-header">Documents</p>
          )}
          <div className="space-y-2">
            {docs.map((upload) => (
              <UploadCard
                key={upload.id}
                upload={upload}
                isCoachOrAdmin={isCoachOrAdmin}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload FAB */}
      <button
        onClick={() => router.push("/uploads/new")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-brand-700 transition-colors z-30"
      >
        <Camera className="w-6 h-6" />
      </button>
    </div>
  );
}
