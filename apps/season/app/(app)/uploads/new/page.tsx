"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { uploadsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import FileUploader from "@/components/uploads/FileUploader";

export default function NewUploadPage() {
  const router = useRouter();
  const { team } = useActiveTeam();

  const [caption, setCaption] = useState("");
  const [seasonLabel, setSeasonLabel] = useState(team?.season_name ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    if (!team) {
      toast.error("No team selected");
      return;
    }
    setUploading(true);
    try {
      // 1. Get presigned URL
      const { upload_id, presigned_url } = await uploadsApi.presign(team.id, {
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      // 2. PUT to S3 directly
      await axios.put(presigned_url, file, {
        headers: {
          "Content-Type": file.type,
        },
        // Don't send auth header to S3
        transformRequest: [(data) => data],
      });

      // 3. Confirm
      await uploadsApi.confirm(upload_id, {
        caption: caption || undefined,
        season_label: seasonLabel || undefined,
      });

      toast.success("Upload successful!");
      router.replace("/uploads");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Upload failed";
      toast.error(msg);
      throw err; // Re-throw so FileUploader can show error state
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Share with Team</h1>
      </div>

      <div className="px-4 space-y-5">
        <FileUploader
          onUpload={handleUpload}
          accept={["image/*", "video/*", "application/pdf"]}
          maxSize={100 * 1024 * 1024}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Caption{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="input-field"
            placeholder="Add a caption…"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Season label{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={seasonLabel}
            onChange={(e) => setSeasonLabel(e.target.value)}
            className="input-field"
            placeholder={team?.season_name ?? "e.g. Spring 2025"}
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}
