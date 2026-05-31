import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday } from "date-fns";
import type { EventType, RSVPStatus, ChannelWithMeta, User } from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "h:mm a");
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "EEE MMM d");
}

export function formatEventDate(start: string, end?: string): string {
  const startDate = new Date(start);
  const dateStr = format(startDate, "EEE MMM d");
  const startTime = format(startDate, "h:mm a");
  if (end) {
    const endTime = format(new Date(end), "h:mm a");
    return `${dateStr} · ${startTime} – ${endTime}`;
  }
  return `${dateStr} · ${startTime}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  practice: "border-success-500 bg-success-50",
  game: "border-brand-500 bg-brand-50",
  other: "border-gray-400 bg-gray-50",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  practice: "Practice",
  game: "Game",
  other: "Event",
};

export const RSVP_COLORS: Record<RSVPStatus, string> = {
  yes: "bg-success-500",
  no: "bg-danger-500",
  maybe: "bg-amber-500",
};

export function getChannelDisplayName(
  channel: ChannelWithMeta,
  currentUserId: string
): string {
  if (channel.channel_type === "direct" && channel.other_user) {
    const u = channel.other_user;
    return `${u.first_name} ${u.last_name.charAt(0)}.`;
  }
  return channel.name ?? "Channel";
}

export function getUserInitials(user: User): string {
  const first = user.first_name?.charAt(0)?.toUpperCase() ?? "";
  const last = user.last_name?.charAt(0)?.toUpperCase() ?? "";
  return `${first}${last}`;
}
