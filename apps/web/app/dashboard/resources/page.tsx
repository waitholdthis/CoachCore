"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Lightbulb, Clock, ChevronRight } from "lucide-react";
import { resourcesApi } from "@/lib/api";
import type { Resource } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  tip: "bg-brand-100 text-brand-700",
  article: "bg-slate-100 text-slate-700",
  motivation: "bg-pink-100 text-pink-700",
  best_practice: "bg-amber-100 text-amber-700",
};

const TABS = ["All", "Tips", "Articles", "Motivation", "Best Practices"];
const TAB_FILTER: Record<string, string> = {
  "All": "",
  "Tips": "tip",
  "Articles": "article",
  "Motivation": "motivation",
  "Best Practices": "best_practice",
};

function ResourceCard({ resource, featured = false }: { resource: Resource; featured?: boolean }) {
  const typeKey = resource.resource_type.toLowerCase().replace(" ", "_");
  const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.article;
  const excerpt = resource.body.slice(0, 150) + (resource.body.length > 150 ? "…" : "");

  return (
    <Link
      href={`/dashboard/resources/${resource.id}`}
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col group",
        featured && "min-w-[280px]"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", colorClass)}>
          {resource.resource_type.replace("_", " ")}
        </span>
        {resource.read_time_minutes && (
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Clock size={11} /> {resource.read_time_minutes} min
          </span>
        )}
      </div>
      <h3 className="font-semibold text-slate-900 text-sm mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
        {resource.title}
      </h3>
      {!featured && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-3 leading-relaxed flex-1">{excerpt}</p>
      )}
      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      )}
      {featured && (
        <div className="flex items-center gap-1 text-brand-600 text-xs font-medium mt-3">
          Read more <ChevronRight size={12} />
        </div>
      )}
    </Link>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [featured, setFeatured] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    resourcesApi.featured().then(setFeatured).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Parameters<typeof resourcesApi.list>[0] = {};
    const typeFilter = TAB_FILTER[activeTab];
    if (typeFilter) params.resource_type = typeFilter;
    if (search) params.search = search;

    resourcesApi
      .list(params)
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Motivational Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Tips, articles, and best practices to elevate your coaching</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        />
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

      {/* Featured */}
      {featured.length > 0 && activeTab === "All" && !search && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.slice(0, 3).map((r) => (
              <ResourceCard key={r.id} resource={r} featured />
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Lightbulb size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium mb-2">No resources found</p>
          <p className="text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">{resources.length} resource{resources.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
