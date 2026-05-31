"use client";

import Link from "next/link";
import { Hash, Megaphone, User } from "lucide-react";
import type { ChannelWithMeta } from "@/lib/types";
import { getChannelDisplayName, formatMessageTime, getUserInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  channel: ChannelWithMeta;
  currentUserId: string;
}

export default function ChannelListItem({ channel, currentUserId }: Props) {
  const isAnnouncements = channel.channel_type === "announcements";
  const isDM = channel.channel_type === "direct";
  const displayName = getChannelDisplayName(channel, currentUserId);
  const lastMsg = channel.last_message;

  return (
    <Link
      href={`/messages/${channel.id}`}
      className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-0"
    >
      {/* Icon / Avatar */}
      <div
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
          isAnnouncements
            ? "bg-amber-50"
            : isDM
            ? "bg-brand-100"
            : "bg-gray-100"
        )}
      >
        {isDM && channel.other_user ? (
          <span className="text-sm font-semibold text-brand-700">
            {getUserInitials(channel.other_user)}
          </span>
        ) : isAnnouncements ? (
          <Megaphone className="w-5 h-5 text-amber-600" />
        ) : (
          <Hash className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-900 truncate">
            {displayName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {lastMsg && (
              <span className="text-xs text-gray-400">
                {formatMessageTime(lastMsg.created_at)}
              </span>
            )}
            {channel.unread_count > 0 && (
              <span className="w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {channel.unread_count > 9 ? "9+" : channel.unread_count}
              </span>
            )}
          </div>
        </div>
        {lastMsg && (
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {lastMsg.is_deleted ? (
              <em>Message deleted</em>
            ) : (
              lastMsg.content
            )}
          </p>
        )}
        {!lastMsg && (
          <p className="text-sm text-gray-400 mt-0.5">No messages yet</p>
        )}
      </div>

      {isAnnouncements && (
        <div className="shrink-0">
          <User className="w-3.5 h-3.5 text-amber-500" />
        </div>
      )}
    </Link>
  );
}
