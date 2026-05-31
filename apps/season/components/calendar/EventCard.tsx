"use client";

import Link from "next/link";
import { MapPin, Check, X, Minus } from "lucide-react";
import type { Event, RSVP } from "@/lib/types";
import { formatEventDate, EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  event: Event;
  myRsvp?: RSVP;
}

export default function EventCard({ event, myRsvp }: Props) {
  const colorClass = EVENT_TYPE_COLORS[event.event_type];
  const typeLabel = EVENT_TYPE_LABELS[event.event_type];

  return (
    <Link href={`/calendar/${event.id}`} className="block">
      <div className={cn("event-card border-l-4", colorClass)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Type pill */}
            <span
              className={cn(
                "inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5",
                event.event_type === "practice" &&
                  "bg-success-100 text-success-600",
                event.event_type === "game" && "bg-brand-100 text-brand-600",
                event.event_type === "other" && "bg-gray-100 text-gray-600"
              )}
            >
              {typeLabel}
            </span>
            {event.is_cancelled && (
              <span className="ml-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-danger-50 text-danger-500">
                Cancelled
              </span>
            )}

            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-base leading-tight">
              {event.title}
            </h3>

            {/* Date/time */}
            <p className="text-sm text-gray-500 mt-0.5">
              {formatEventDate(event.start_time, event.end_time)}
            </p>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 truncate">
                  {event.location}
                </span>
              </div>
            )}
          </div>

          {/* RSVP status badge */}
          <div className="shrink-0">
            {myRsvp ? (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl",
                  myRsvp.status === "yes" &&
                    "bg-success-50 text-success-600",
                  myRsvp.status === "no" && "bg-danger-50 text-danger-500",
                  myRsvp.status === "maybe" &&
                    "bg-amber-50 text-amber-600"
                )}
              >
                {myRsvp.status === "yes" && <Check className="w-3.5 h-3.5" />}
                {myRsvp.status === "no" && <X className="w-3.5 h-3.5" />}
                {myRsvp.status === "maybe" && (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span>
                  {myRsvp.status === "yes"
                    ? "Going"
                    : myRsvp.status === "no"
                    ? "Can't"
                    : "Maybe"}
                </span>
              </div>
            ) : (
              <div className="text-xs font-medium text-gray-400 px-2 py-1.5 border border-gray-200 rounded-xl">
                RSVP
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
