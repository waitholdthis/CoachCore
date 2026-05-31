"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { eventsApi, teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { EventType } from "@/lib/types";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "practice", label: "Practice" },
  { value: "game", label: "Game" },
  { value: "other", label: "Other" },
];

export default function NewEventPage() {
  const router = useRouter();
  const { team } = useActiveTeam();
  const currentUser = getUser();

  const { data: members } = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => teamsApi.members(team!.id),
    enabled: !!team,
  });

  const myMember = members?.find((m) => m.user_id === currentUser?.id);
  const isCoachOrAdmin =
    myMember?.role === "coach" || myMember?.role === "admin";

  // Redirect non-coaches
  useEffect(() => {
    if (members && !isCoachOrAdmin) {
      toast.error("Only coaches can create events");
      router.replace("/calendar");
    }
  }, [members, isCoachOrAdmin, router]);

  const [form, setForm] = useState({
    title: "",
    event_type: "practice" as EventType,
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!team) return;
    if (!form.title || !form.date || !form.start_time) {
      toast.error("Please fill in title, date, and start time");
      return;
    }
    setLoading(true);
    try {
      const start_time = `${form.date}T${form.start_time}:00`;
      const end_time = form.end_time
        ? `${form.date}T${form.end_time}:00`
        : undefined;

      await eventsApi.create(team.id, {
        title: form.title,
        event_type: form.event_type,
        start_time,
        end_time,
        location: form.location || undefined,
        notes: form.notes || undefined,
      });
      toast.success("Event created!");
      router.replace("/calendar");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Failed to create event";
      toast.error(msg);
    } finally {
      setLoading(false);
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
        <h1 className="text-xl font-bold text-gray-900">New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Title <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="input-field"
            placeholder="e.g. Tuesday Practice"
            required
          />
        </div>

        {/* Event type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type
          </label>
          <div className="flex gap-2">
            {EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => update("event_type", value)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                  form.event_type === value
                    ? value === "practice"
                      ? "bg-success-500 text-white border-success-500"
                      : value === "game"
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-gray-700 text-white border-gray-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date <span className="text-danger-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="input-field"
            required
          />
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start time <span className="text-danger-500">*</span>
            </label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => update("start_time", e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              End time{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => update("end_time", e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Location{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            className="input-field"
            placeholder="e.g. Riverside Park Field 3"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notes{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Any extra details for this event…"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating…
            </span>
          ) : (
            "Create Event"
          )}
        </button>
      </form>
    </div>
  );
}
