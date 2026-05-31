"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { leaguesApi } from "@/lib/api";
import { SPORT_EMOJI, SPORT_COLORS, formatDate } from "@/lib/utils";
import type { League } from "@/lib/types";

export default function DashboardPage() {
  const { data: leagues, isLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: () => leaguesApi.list(),
  });

  const totalConflicts = leagues?.reduce((sum, l) => sum + l.conflict_count, 0) ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your leagues and rulebooks</p>
        </div>
        <Link
          href="/dashboard/leagues/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New League
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active Leagues</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{leagues?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Conflicts</p>
          <p className={`text-3xl font-bold mt-1 ${totalConflicts > 0 ? "text-conflict-600" : "text-green-600"}`}>
            {totalConflicts}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Uploads</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {leagues?.reduce((sum, l) => sum + l.upload_count, 0) ?? 0}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/chat"
          className="bg-brand-600 text-white rounded-xl p-5 hover:bg-brand-700 transition-colors group"
        >
          <p className="font-semibold text-lg">Rule Check Chatbot</p>
          <p className="text-brand-200 text-sm mt-1">Ask any youth sports rule question</p>
          <ArrowRight size={20} className="mt-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/dashboard/diff"
          className="bg-slate-800 text-white rounded-xl p-5 hover:bg-slate-900 transition-colors group"
        >
          <p className="font-semibold text-lg">Rule Diff Generator</p>
          <p className="text-slate-400 text-sm mt-1">Compare home vs. away tournament rules</p>
          <ArrowRight size={20} className="mt-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* League List */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Leagues</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        ) : leagues?.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-400 mb-4">No leagues yet</p>
            <Link
              href="/dashboard/leagues/new"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              Create your first league
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues?.map((league) => (
              <LeagueRow key={league.id} league={league} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeagueRow({ league }: { league: League }) {
  return (
    <Link
      href={`/dashboard/leagues/${league.id}`}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
    >
      <div className="text-3xl">{SPORT_EMOJI[league.sport]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate">{league.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${SPORT_COLORS[league.sport]}`}>
            {league.sport}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {league.season && `${league.season} · `}
          {league.age_brackets_served.join(", ")}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {league.conflict_count > 0 ? (
          <span className="flex items-center gap-1 text-conflict-600">
            <AlertTriangle size={14} /> {league.conflict_count} conflicts
          </span>
        ) : (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={14} /> Clean
          </span>
        )}
        <span className="text-slate-400">{league.upload_count} uploads</span>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
