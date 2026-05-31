"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { formatMessageTime, getUserInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onDelete?: (messageId: string) => void;
}

export default function MessageBubble({ message, isOwn, showAvatar, onDelete }: Props) {
  const [showActions, setShowActions] = useState(false);

  // Touch long-press support
  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  function handleTouchStart() {
    if (!isOwn) return;
    pressTimer = setTimeout(() => {
      setShowActions(true);
    }, 500);
  }

  function handleTouchEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!isOwn) return;
    e.preventDefault();
    setShowActions((prev) => !prev);
  }

  if (message.is_deleted) {
    return (
      <div className={cn("flex mb-1", isOwn ? "justify-end" : "justify-start")}>
        {!isOwn && <div className="w-8 mr-2 shrink-0" />}
        <p className="text-sm italic text-gray-400 px-3 py-1">
          [Message deleted]
        </p>
      </div>
    );
  }

  const initials = getUserInitials(message.sender);

  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar — only for other's messages */}
      {!isOwn && (
        <div className="shrink-0 mb-1">
          {showAvatar ? (
            <div className="avatar w-8 h-8 text-xs">{initials}</div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        {/* Sender name — only show for first bubble in run */}
        {!isOwn && showAvatar && (
          <span className="text-xs font-semibold text-gray-500 mb-1 px-1">
            {message.sender.first_name} {message.sender.last_name}
          </span>
        )}

        <div className="relative">
          <div
            className={cn(
              isOwn ? "message-bubble-self" : "message-bubble-other"
            )}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>

          {/* Delete action popup */}
          {showActions && isOwn && onDelete && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute bottom-full mb-2 right-0 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <button
                  onClick={() => {
                    onDelete(message.id);
                    setShowActions(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-danger-500 text-sm font-medium hover:bg-danger-50 transition-colors w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete message
                </button>
              </div>
            </>
          )}
        </div>

        {/* Timestamp + edited indicator */}
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-xs text-gray-400">
            {formatMessageTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>
      </div>
    </div>
  );
}
