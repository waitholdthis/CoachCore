"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Paperclip, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { messagesApi, teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser } from "@/lib/auth";
import { useTeamSocket } from "@/lib/websocket";
import MessageBubble from "@/components/messages/MessageBubble";
import type { Message, WSEvent } from "@/lib/types";
import { getChannelDisplayName } from "@/lib/utils";

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.channelId as string;
  const { team } = useActiveTeam();
  const currentUser = getUser();
  const qc = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Channel info
  const { data: channels } = useQuery({
    queryKey: ["channels", team?.id],
    queryFn: () => messagesApi.channels(team!.id),
    enabled: !!team,
  });

  const channel = channels?.find((c) => c.id === channelId);

  // My membership
  const { data: members } = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => teamsApi.members(team!.id),
    enabled: !!team,
  });
  const myMember = members?.find((m) => m.user_id === currentUser?.id);
  const isCoachOrAdmin =
    myMember?.role === "coach" || myMember?.role === "admin";
  const isAnnouncements = channel?.channel_type === "announcements";
  const canPost = !isAnnouncements || isCoachOrAdmin;

  // Initial messages
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => messagesApi.messages(channelId, undefined, 50),
    enabled: !!channelId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      // Mark read
      messagesApi.markRead(channelId).catch(() => {});
    }
  }, [initialMessages, channelId]);

  // WebSocket handler
  const handleWSEvent = useCallback(
    (event: WSEvent) => {
      if (event.type === "new_message" && event.channel_id === channelId) {
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [event.message, ...prev];
        });
        messagesApi.markRead(channelId).catch(() => {});
        qc.invalidateQueries({ queryKey: ["channels", team?.id] });
      }
      if (event.type === "message_edited" && event.channel_id === channelId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === event.message.id ? event.message : m))
        );
      }
      if (event.type === "message_deleted" && event.channel_id === channelId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.message_id ? { ...m, is_deleted: true } : m
          )
        );
      }
    },
    [channelId, team?.id, qc]
  );

  useTeamSocket(team?.id ?? null, handleWSEvent);

  // Auto scroll to bottom when messages update (new messages prepended at index 0)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load older messages when scrolling to top
  async function handleScroll() {
    const container = messagesContainerRef.current;
    if (!container || loadingMore) return;
    if (container.scrollTop < 80 && messages.length > 0) {
      const oldest = messages[messages.length - 1];
      setLoadingMore(true);
      try {
        const older = await messagesApi.messages(channelId, oldest.created_at, 30);
        if (older.length > 0) {
          setMessages((prev) => [...prev, ...older]);
        }
      } catch {
        // ignore
      } finally {
        setLoadingMore(false);
      }
    }
  }

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      messagesApi.sendMessage(channelId, content),
    onSuccess: (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
      qc.invalidateQueries({ queryKey: ["channels", team?.id] });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      messagesApi.deleteMessage(channelId, messageId),
    onSuccess: (_, messageId) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true } : m
        )
      );
    },
    onError: () => {
      toast.error("Failed to delete message");
    },
  });

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    try {
      await sendMutation.mutateAsync(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const displayName = channel
    ? getChannelDisplayName(channel, currentUser?.id ?? "")
    : "Channel";

  // Determine which messages need avatar shown
  // messages array is newest-first; for display we reverse it
  const displayMessages = [...messages].reverse();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900 text-base">{displayName}</h1>
          {channel?.channel_type === "team_chat" && (
            <p className="text-xs text-gray-400">Team chat</p>
          )}
        </div>
      </div>

      {/* Announcements info bar */}
      {isAnnouncements && !isCoachOrAdmin && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            Only coaches can post in announcements
          </p>
        </div>
      )}

      {/* Messages — flex-col-reverse so newest is at bottom */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col-reverse px-4 py-3 gap-0.5"
      >
        <div ref={messagesEndRef} />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          displayMessages.map((msg, idx) => {
            const isOwn = msg.sender_id === currentUser?.id;
            // showAvatar = first message in a run from this sender
            const prevMsg = displayMessages[idx - 1];
            const showAvatar =
              !isOwn &&
              (!prevMsg || prevMsg.sender_id !== msg.sender_id);

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onDelete={
                  isOwn
                    ? (id) => deleteMutation.mutate(id)
                    : undefined
                }
              />
            );
          })
        )}

        {/* Load more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-brand-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-3 py-3 flex items-end gap-2 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <Paperclip className="w-5 h-5 text-gray-400" />
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canPost}
          placeholder={
            canPost ? "Type a message…" : "Only coaches can post here"
          }
          rows={1}
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none max-h-32 disabled:bg-gray-50 disabled:text-gray-400"
          style={{ minHeight: "44px" }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || sending || !canPost}
          className="w-10 h-10 flex items-center justify-center bg-brand-500 rounded-full disabled:opacity-40 active:bg-brand-700 transition-colors shrink-0"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
