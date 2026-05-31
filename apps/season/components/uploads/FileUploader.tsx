"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

interface Props {
  onUpload: (file: File) => Promise<void>;
  accept?: string[];
  maxSize?: number;
}

export default function FileUploader({
  onUpload,
  accept = ["image/*", "video/*", "application/pdf"],
  maxSize = 100 * 1024 * 1024, // 100MB
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { errors: { code: string }[] }[]) => {
      setError(null);
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.code === "file-too-large") {
          setError(`File too large. Max size: ${formatFileSize(maxSize)}`);
        } else if (err.code === "file-invalid-type") {
          setError("Invalid file type. Please upload a photo, video, or PDF.");
        } else {
          setError("Invalid file.");
        }
        return;
      }
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setSelectedFile(file);

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreview(url);
      } else {
        setPreview(null);
      }
    },
    [maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize,
    multiple: false,
  });

  async function handleUpload() {
    if (!selectedFile || uploading) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      setPreview(null);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
  }

  if (selectedFile) {
    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    return (
      <div className="space-y-4">
        {/* Preview */}
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden">
          {isImage && preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-64 object-contain"
            />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                {isVideo ? (
                  <Film className="w-6 h-6 text-brand-600" />
                ) : (
                  <FileText className="w-6 h-6 text-brand-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-danger-500 text-center">{error}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </span>
          ) : (
            "Upload"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors",
          isDragActive
            ? "border-brand-500 bg-brand-50"
            : "border-gray-300 hover:border-brand-400 hover:bg-gray-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center">
          <Upload className="w-7 h-7 text-brand-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700">
            {isDragActive ? "Drop it here!" : "Drop a file or tap to browse"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Photos, videos, PDFs up to {formatFileSize(maxSize)}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger-500 text-center">{error}</p>
      )}
    </div>
  );
}
