"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { resourcesApi, savedApi } from "@/lib/api";
import type { Resource, SavedItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  tip: "bg-brand-100 text-brand-700",
  article: "bg-slate-100 text-slate-700",
  motivation: "bg-pink-100 text-pink-700",
  best_practice: "bg-amber-100 text-amber-700",
};

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [related, setRelated] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);

  useEffect(() => {
    Promise.all([
      resourcesApi.get(id),
      savedApi.list("resource"),
    ])
      .then(([r, saved]) => {
        setResource(r);
        const match = saved.find((s) => s.item_id === id && s.item_type === "resource");
        setSavedItem(match ?? null);
        // Load related
        return resourcesApi.list({ resource_type: r.resource_type });
      })
      .then((list) => setRelated(list.filter((r) => r.id !== id).slice(0, 3)))
      .catch((e) => setError(e?.response?.data?.detail ?? e.message ?? "Failed to load resource"))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!resource) return;
    setSavingToggle(true);
    try {
      if (savedItem) {
        await savedApi.unsaveByItem("resource", resource.id);
        setSavedItem(null);
      } else {
        const result = await savedApi.save({ item_type: "resource", item_id: resource.id, title: resource.title });
        setSavedItem(result);
      }
    } catch {
      // ignore
    } finally {
      setSavingToggle(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="h-8 w-32 bg-slate-100 animate-pulse rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link href="/dashboard/resources" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error ?? "Resource not found"}
        </div>
      </div>
    );
  }

  const typeKey = resource.resource_type.toLowerCase().replace(" ", "_");
  const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.article;
  const paragraphs = resource.body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/dashboard/resources" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Motivational Hub
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", colorClass)}>
              {resource.resource_type.replace("_", " ")}
            </span>
            {resource.read_time_minutes && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                <Clock size={11} /> {resource.read_time_minutes} min read
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{resource.title}</h1>
            <button
              onClick={toggleSave}
              disabled={savingToggle}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shrink-0",
                savedItem
                  ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              {savedItem ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {savedItem ? "Saved" : "Save"}
            </button>
          </div>

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {resource.tags.map((tag) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="prose prose-sm max-w-none">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-slate-700 leading-relaxed mb-4 text-[15px]">{para}</p>
            ))}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm sticky top-6">
              <h2 className="font-semibold text-slate-900 text-sm mb-4">Related Resources</h2>
              <div className="space-y-3">
                {related.map((r) => {
                  const rKey = r.resource_type.toLowerCase().replace(" ", "_");
                  const rColor = TYPE_COLORS[rKey] ?? TYPE_COLORS.article;
                  return (
                    <Link
                      key={r.id}
                      href={`/dashboard/resources/${r.id}`}
                      className="block group"
                    >
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", rColor)}>
                        {r.resource_type.replace("_", " ")}
                      </span>
                      <p className="text-sm font-medium text-slate-800 mt-1.5 group-hover:text-brand-700 transition-colors line-clamp-2">
                        {r.title}
                      </p>
                      {r.read_time_minutes && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={10} /> {r.read_time_minutes} min
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
