"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertTriangle } from "lucide-react";
import { leaguesApi } from "@/lib/api";
import { SPORT_EMOJI, SPORT_COLORS, formatDate } from "@/lib/utils";

export default function LeaguesPage() {
  const { data: leagues, isLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: () => leaguesApi.list(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Leagues</h1>
        <Link
          href="/dashboard/leagues/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2"
        >
          <Plus size={16} /> New League
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
        </div>
      ) : leagues?.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-16 text-center">
          <p className="text-slate-400 mb-4">No leagues yet</p>
          <Link href="/dashboard/leagues/new" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Create your first league
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues?.map(league => (
            <Link key={league.id} href={`/dashboard/leagues/${league.id}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="text-4xl">{SPORT_EMOJI[league.sport]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{league.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${SPORT_COLORS[league.sport]}`}>
                    {league.sport}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {league.season && `${league.season} · `}
                  {league.age_brackets_served.join(", ")}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-400">{league.upload_count} uploads</p>
                {league.conflict_count > 0 && (
                  <p className="text-conflict-600 flex items-center gap-1 justify-end mt-0.5">
                    <AlertTriangle size={12} /> {league.conflict_count}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
