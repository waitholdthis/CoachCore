"use client";

import { useState } from "react";
import { Bell, ChevronDown, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { cn } from "@/lib/utils";
import type { TeamWithMeta } from "@/lib/types";

export default function AppHeader() {
  const { team, setTeam } = useActiveTeam();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamsApi.myTeams(),
    staleTime: 60 * 1000,
  });

  function handleSelectTeam(t: TeamWithMeta) {
    setTeam(t);
    setDropdownOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <span className="text-lg font-bold text-brand-600 tracking-tight">
          The Season
        </span>

        {/* Team dropdown */}
        <div className="relative flex-1 flex justify-center">
          {team ? (
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors max-w-[160px]"
            >
              <span className="truncate">{team.name}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform shrink-0",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>
          ) : (
            <span className="text-sm text-gray-400">No team selected</span>
          )}

          {dropdownOpen && teams && teams.length > 0 && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 min-w-[200px]">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTeam(t)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <div className="font-medium">{t.name}</div>
                      {t.sport && (
                        <div className="text-xs text-gray-400">{t.sport}</div>
                      )}
                    </div>
                    {team?.id === t.id && (
                      <Check className="w-4 h-4 text-brand-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notification bell */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
