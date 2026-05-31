"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { eventsApi, teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser } from "@/lib/auth";
import EventCard from "@/components/calendar/EventCard";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

export default function CalendarPage() {
  const { team } = useActiveTeam();
  const currentUser = getUser();
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const from = format(today, "yyyy-MM-dd");
  const to = format(addDays(today, 90), "yyyy-MM-dd");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", team?.id, from, to],
    queryFn: () => eventsApi.list(team!.id, from, to),
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

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Days with events
  const eventDays = new Set(
    (events ?? []).map((e) => format(new Date(e.start_time), "yyyy-MM-dd"))
  );

  // Filtered events for display
  const filteredEvents = selectedDay
    ? (events ?? []).filter((e) =>
        isSameDay(new Date(e.start_time), selectedDay)
      )
    : (events ?? []).filter((e) =>
        isSameMonth(new Date(e.start_time), currentMonth)
      );

  if (!team) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-5xl mb-4">📅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No team selected</h2>
        <p className="text-gray-500 text-sm">Join a team to see events</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Month navigation */}
      <div className="px-4 pt-4 flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="px-4 grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="px-4 grid grid-cols-7 gap-y-1 mb-4">
        {calDays.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const isToday_ = isSameDay(day, today);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const hasEvent = eventDays.has(dayStr);

          return (
            <button
              key={dayStr}
              onClick={() =>
                setSelectedDay((prev) =>
                  prev && isSameDay(prev, day) ? null : day
                )
              }
              className={cn(
                "flex flex-col items-center py-1.5 rounded-xl transition-colors",
                !inMonth && "opacity-30",
                isSelected && "bg-brand-500",
                !isSelected && isToday_ && "bg-brand-50",
                !isSelected && !isToday_ && "hover:bg-gray-100"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected && "text-white",
                  !isSelected && isToday_ && "text-brand-600",
                  !isSelected && !isToday_ && "text-gray-700"
                )}
              >
                {format(day, "d")}
              </span>
              {hasEvent && (
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-0.5",
                    isSelected ? "bg-white" : "bg-brand-500"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Events list */}
      <div className="px-4">
        <p className="section-header">
          {selectedDay
            ? format(selectedDay, "EEEE, MMMM d")
            : "This Month"}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-500 text-sm">
              {selectedDay
                ? "No events on this day"
                : "No events this month"}
            </p>
          </div>
        )}
      </div>

      {/* FAB for coaches */}
      {isCoachOrAdmin && (
        <button
          onClick={() => router.push("/calendar/new")}
          className="fixed bottom-24 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-brand-700 transition-colors z-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
