"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import { savedApi } from "@/lib/api";
import type { SavedItem } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

const TABS = ["All", "Drills", "Templates", "Resources", "Plans"];
const TAB_FILTER: Record<string, string> = {
  "All": "",
  "Drills": "drill",
  "Templates": "template",
  "Resources": "resource",
  "Plans": "plan",
};

const TYPE_COLORS: Record<string, string> = {
  drill: "bg-green-100 text-green-700",
  template: "bg-blue-100 text-blue-700",
  resource: "bg-pink-100 text-pink-700",
  plan: "bg-brand-100 text-brand-700",
};

function itemLink(item: SavedItem): string {
  switch (item.item_type) {
    case "drill": return `/dashboard/drills/${item.item_id}`;
    case "template": return `/dashboard/drills`; // templates don't have a dedicated detail page yet
    case "resource": return `/dashboard/resources/${item.item_id}`;
    case "plan": return `/dashboard/practice/${item.item_id}`;
    default: return `/dashboard`;
  }
}

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const typeFilter = TAB_FILTER[activeTab];

  useEffect(() => {
    setLoading(true);
    savedApi
      .list(typeFilter || undefined)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [typeFilter]);

  async function handleUnsave(item: SavedItem) {
    if (!window.confirm(`Remove "${item.title}" from saved?`)) return;
    try {
      await savedApi.unsave(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {}
  }

  const sorted = [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Saved Resources</h1>
        <p className="text-slate-500 text-sm mt-1">Drills, resources, and plans you've bookmarked</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Bookmark size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">Nothing saved yet</p>
          <p className="text-slate-400 text-sm mb-6">
            Bookmark drills and resources while browsing to find them here.
          </p>
          <Link
            href="/dashboard/drills"
            className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Browse Drills
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                    TYPE_COLORS[item.item_type] ?? "bg-slate-100 text-slate-600"
                  )}>
                    {item.item_type}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{item.title}</h3>
                {item.notes && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.notes}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">Saved {formatDate(item.created_at)}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  href={itemLink(item)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
                >
                  <ExternalLink size={12} /> Visit
                </Link>
                <button
                  onClick={() => handleUnsave(item)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
