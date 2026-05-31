"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  ExternalLink,
  Check,
  X,
  Minus,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { eventsApi, teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser } from "@/lib/auth";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
  formatEventDate,
  getUserInitials,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RSVPStatus, RSVP } from "@/lib/types";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { team } = useActiveTeam();
  const currentUser = getUser();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.get(eventId),
  });

  const { data: members } = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => teamsApi.members(team!.id),
    enabled: !!team,
  });

  const myMember = members?.find((m) => m.user_id === currentUser?.id);
  const isCoachOrAdmin =
    myMember?.role === "coach" || myMember?.role === "admin";

  const rsvpMutation = useMutation({
    mutationFn: ({ status, note }: { status: RSVPStatus; note?: string }) =>
      eventsApi.rsvp(eventId, status, note),
    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: ["event", eventId] });
      const prev = qc.getQueryData(["event", eventId]);
      qc.setQueryData(["event", eventId], (old: typeof event) => {
        if (!old || !currentUser) return old;
        const fakeRsvp: RSVP = {
          id: "optimistic",
          event_id: eventId,
          user_id: currentUser.id,
          status,
          updated_at: new Date().toISOString(),
          user: currentUser,
        };
        const rsvps = old.rsvps.filter(
          (r) => r.user_id !== currentUser.id
        );
        return {
          ...old,
          my_rsvp: fakeRsvp,
          rsvps: [...rsvps, fakeRsvp],
          yes_count: rsvps.filter((r) => r.status === "yes").length + (status === "yes" ? 1 : 0),
          no_count: rsvps.filter((r) => r.status === "no").length + (status === "no" ? 1 : 0),
          maybe_count: rsvps.filter((r) => r.status === "maybe").length + (status === "maybe" ? 1 : 0),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["event", eventId], ctx?.prev);
      toast.error("Failed to update RSVP");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
      router.replace("/calendar");
    },
    onError: () => {
      toast.error("Failed to delete event");
    },
  });

  async function confirmDelete() {
    if (window.confirm("Delete this event? This cannot be undone.")) {
      deleteMutation.mutate();
    }
  }

  if (isLoading || !event) {
    return (
      <div className="page-container">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/2" />
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-3 w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  const colorClass = EVENT_TYPE_COLORS[event.event_type];
  const typeLabel = EVENT_TYPE_LABELS[event.event_type];
  const myRsvp = event.my_rsvp;

  const yesRsvps = event.rsvps.filter((r) => r.status === "yes");
  const noRsvps = event.rsvps.filter((r) => r.status === "no");
  const maybeRsvps = event.rsvps.filter((r) => r.status === "maybe");

  const rsvpButtons: { status: RSVPStatus; label: string; icon: React.ReactNode; active: string; inactive: string }[] = [
    {
      status: "yes",
      label: "Going",
      icon: <Check className="w-4 h-4" />,
      active: "bg-success-500 text-white border-success-500",
      inactive: "bg-white text-gray-600 border-gray-200 hover:border-success-300",
    },
    {
      status: "no",
      label: "Can't Make It",
      icon: <X className="w-4 h-4" />,
      active: "bg-danger-500 text-white border-danger-500",
      inactive: "bg-white text-gray-600 border-gray-200 hover:border-danger-300",
    },
    {
      status: "maybe",
      label: "Maybe",
      icon: <Minus className="w-4 h-4" />,
      active: "bg-amber-500 text-white border-amber-500",
      inactive: "bg-white text-gray-600 border-gray-200 hover:border-amber-300",
    },
  ];

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3 mb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-500">Event</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block text-xs font-semibold px-2.5 py-1 rounded-full",
              event.event_type === "practice" && "bg-success-100 text-success-600",
              event.event_type === "game" && "bg-brand-100 text-brand-600",
              event.event_type === "other" && "bg-gray-100 text-gray-600"
            )}
          >
            {typeLabel}
          </span>
          {event.is_cancelled && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-danger-50 text-danger-500">
              Cancelled
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
            <span className="text-sm">{formatEventDate(event.start_time, event.end_time)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="text-sm">{event.location}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {event.notes && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.notes}</p>
          </div>
        )}

        {/* RSVP buttons */}
        <div>
          <p className="section-header">Your RSVP</p>
          <div className="flex gap-2">
            {rsvpButtons.map(({ status, label, icon, active, inactive }) => (
              <button
                key={status}
                onClick={() => rsvpMutation.mutate({ status })}
                className={cn(
                  "rsvp-btn flex items-center justify-center gap-1.5",
                  myRsvp?.status === status ? active : inactive
                )}
              >
                {icon}
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div>
          <p className="section-header">Attendance</p>

          {yesRsvps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-success-600 mb-2">
                Going ({yesRsvps.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {yesRsvps.map((r) => (
                  <RSVPChip key={r.id} rsvp={r} />
                ))}
              </div>
            </div>
          )}

          {maybeRsvps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-amber-600 mb-2">
                Maybe ({maybeRsvps.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {maybeRsvps.map((r) => (
                  <RSVPChip key={r.id} rsvp={r} />
                ))}
              </div>
            </div>
          )}

          {noRsvps.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-danger-500 mb-2">
                Can&apos;t Make It ({noRsvps.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {noRsvps.map((r) => (
                  <RSVPChip key={r.id} rsvp={r} />
                ))}
              </div>
            </div>
          )}

          {event.rsvps.length === 0 && (
            <p className="text-sm text-gray-400">No responses yet</p>
          )}
        </div>

        {/* Add to calendar */}
        {team && (
          <a
            href={eventsApi.icalUrl(team.id)}
            className="flex items-center gap-2 text-brand-600 text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
            Add to Calendar (.ics)
          </a>
        )}

        {/* Coach actions */}
        {isCoachOrAdmin && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => router.push(`/calendar/${eventId}/edit`)}
              className="btn-secondary flex items-center gap-2 flex-1 justify-center"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 flex items-center justify-center gap-2 bg-danger-50 text-danger-500 font-semibold py-3 px-6 rounded-xl active:bg-danger-100 transition-colors border border-danger-100"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RSVPChip({ rsvp }: { rsvp: RSVP }) {
  const initials = getUserInitials(rsvp.user);
  return (
    <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 py-1">
      <div className="avatar w-5 h-5 text-[10px]">{initials}</div>
      <span className="text-xs text-gray-700">
        {rsvp.user.first_name} {rsvp.user.last_name}
      </span>
    </div>
  );
}
