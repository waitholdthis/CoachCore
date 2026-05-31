"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Search } from "lucide-react";
import { toast } from "sonner";
import { messagesApi, teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser } from "@/lib/auth";
import ChannelListItem from "@/components/messages/ChannelListItem";
import { getUserInitials } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

export default function MessagesPage() {
  const { team } = useActiveTeam();
  const currentUser = getUser();
  const qc = useQueryClient();

  const [showDMModal, setShowDMModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data: channels, isLoading } = useQuery({
    queryKey: ["channels", team?.id],
    queryFn: () => messagesApi.channels(team!.id),
    enabled: !!team,
  });

  const { data: members } = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => teamsApi.members(team!.id),
    enabled: !!team && showDMModal,
  });

  const openDMMutation = useMutation({
    mutationFn: (userId: string) => messagesApi.openDM(team!.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["channels", team?.id] });
      setShowDMModal(false);
      toast.success("Direct message opened");
    },
    onError: () => {
      toast.error("Failed to open DM");
    },
  });

  const teamChannels = channels?.filter(
    (c) => c.channel_type === "team_chat" || c.channel_type === "announcements"
  );
  const dmChannels = channels?.filter((c) => c.channel_type === "direct");

  const filteredMembers = members?.filter((m) => {
    if (m.user_id === currentUser?.id) return false;
    if (!m.is_approved) return false;
    const name = `${m.user.first_name} ${m.user.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (!team) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-5xl mb-4">⚽</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          No team selected
        </h2>
        <p className="text-gray-500 text-sm">
          Join or create a team to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Team channels */}
      <div className="px-4 pt-4">
        <p className="section-header">Team</p>
      </div>
      <div className="bg-white rounded-2xl mx-4 shadow-sm overflow-hidden">
        {isLoading ? (
          <SkeletonList />
        ) : teamChannels && teamChannels.length > 0 ? (
          teamChannels.map((ch) => (
            <ChannelListItem
              key={ch.id}
              channel={ch}
              currentUserId={currentUser?.id ?? ""}
            />
          ))
        ) : (
          <p className="px-4 py-6 text-gray-400 text-sm text-center">
            No team channels yet
          </p>
        )}
      </div>

      {/* DM channels */}
      {dmChannels && dmChannels.length > 0 && (
        <>
          <div className="px-4">
            <p className="section-header">Direct Messages</p>
          </div>
          <div className="bg-white rounded-2xl mx-4 shadow-sm overflow-hidden">
            {dmChannels.map((ch) => (
              <ChannelListItem
                key={ch.id}
                channel={ch}
                currentUserId={currentUser?.id ?? ""}
              />
            ))}
          </div>
        </>
      )}

      {/* New DM FAB */}
      <button
        onClick={() => setShowDMModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg flex items-center justify-center active:bg-brand-700 transition-colors z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* New DM Modal */}
      {showDMModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDMModal(false)}
          />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">New Direct Message</h3>
              <button
                onClick={() => setShowDMModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search team members…"
                  className="input-field pl-9"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredMembers?.map((m: TeamMember) => (
                <button
                  key={m.user_id}
                  onClick={() => openDMMutation.mutate(m.user_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="avatar w-10 h-10 text-sm">
                    {getUserInitials(m.user)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {m.user.first_name} {m.user.last_name}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {m.role}
                    </div>
                  </div>
                </button>
              ))}
              {filteredMembers?.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No members found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
          <div className="w-11 h-11 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
}
