"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  UserX,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { teamsApi } from "@/lib/api";
import { useActiveTeam } from "@/app/(app)/layout";
import { getUser, clearActiveTeam, setActiveTeam } from "@/lib/auth";
import { getUserInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { MemberRole, TeamMember } from "@/lib/types";

const ROLE_LABELS: Record<MemberRole, string> = {
  parent: "Parent",
  coach: "Coach",
  admin: "Admin",
};

const ROLE_COLORS: Record<MemberRole, string> = {
  parent: "bg-gray-100 text-gray-600",
  coach: "bg-brand-100 text-brand-700",
  admin: "bg-amber-50 text-amber-700",
};

export default function TeamPage() {
  const { team, setTeam } = useActiveTeam();
  const currentUser = getUser();
  const router = useRouter();
  const qc = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [roleModalMember, setRoleModalMember] = useState<TeamMember | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", team?.id],
    queryFn: () => teamsApi.members(team!.id),
    enabled: !!team,
  });

  const myMember = members?.find((m) => m.user_id === currentUser?.id);
  const isCoachOrAdmin =
    myMember?.role === "coach" || myMember?.role === "admin";

  const pendingMembers = members?.filter(
    (m) => !m.is_approved && m.user_id !== currentUser?.id
  );
  const activeMembers = members?.filter((m) => m.is_approved);

  const approveMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { is_approved?: boolean; role?: MemberRole; child_names?: string[] };
    }) => teamsApi.approveMember(team!.id, userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", team?.id] });
      toast.success("Member updated");
    },
    onError: () => toast.error("Failed to update member"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      teamsApi.removeMember(team!.id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", team?.id] });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const resetInviteMutation = useMutation({
    mutationFn: () => teamsApi.resetInvite(team!.id),
    onSuccess: (updatedTeam) => {
      if (team) {
        const updated = { ...team, invite_code: updatedTeam.invite_code };
        setTeam(updated);
        setActiveTeam(updated);
      }
      toast.success("Invite code reset");
    },
    onError: () => toast.error("Failed to reset invite code"),
  });

  async function copyInviteCode() {
    if (!team) return;
    const inviteUrl = `${window.location.origin}/join/${team.invite_code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Failed to copy");
    }
  }

  function handleLeave() {
    if (!currentUser) return;
    if (
      window.confirm("Are you sure you want to leave this team?")
    ) {
      teamsApi
        .removeMember(team!.id, currentUser.id)
        .then(() => {
          clearActiveTeam();
          qc.invalidateQueries({ queryKey: ["teams"] });
          toast.success("You left the team");
          router.replace("/messages");
        })
        .catch(() => toast.error("Failed to leave team"));
    }
  }

  if (!team) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No team selected</h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Team Info */}
      <div>
        <p className="section-header">Team Info</p>
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Team name</p>
            <p className="font-semibold text-gray-900">{team.name}</p>
          </div>
          {team.sport && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Sport</p>
              <p className="text-gray-700">{team.sport}</p>
            </div>
          )}
          {team.season_name && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Season</p>
              <p className="text-gray-700">
                {team.season_name}
                {team.season_start && team.season_end && (
                  <span className="text-gray-400 text-sm ml-2">
                    {new Date(team.season_start).toLocaleDateString()} –{" "}
                    {new Date(team.season_end).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Invite code */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Invite link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate">
                {`${typeof window !== "undefined" ? window.location.origin : ""}/join/${team.invite_code}`}
              </code>
              <button
                onClick={copyInviteCode}
                className="w-10 h-10 flex items-center justify-center bg-brand-50 rounded-xl text-brand-600 hover:bg-brand-100 transition-colors shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {isCoachOrAdmin && (
            <button
              onClick={() => resetInviteMutation.mutate()}
              disabled={resetInviteMutation.isPending}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5",
                  resetInviteMutation.isPending && "animate-spin"
                )}
              />
              Reset invite code
            </button>
          )}
        </div>
      </div>

      {/* Pending Approvals (coach/admin only) */}
      {isCoachOrAdmin && pendingMembers && pendingMembers.length > 0 && (
        <div>
          <p className="section-header">Pending Approval ({pendingMembers.length})</p>
          <div className="bg-amber-50 rounded-2xl overflow-hidden shadow-sm">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-amber-100 last:border-0"
              >
                <div className="avatar w-10 h-10 text-sm">
                  {getUserInitials(member.user)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {member.user.first_name} {member.user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      approveMutation.mutate({
                        userId: member.user_id,
                        data: { is_approved: true },
                      })
                    }
                    className="w-9 h-9 flex items-center justify-center bg-success-500 text-white rounded-xl"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      removeMutation.mutate(member.user_id)
                    }
                    className="w-9 h-9 flex items-center justify-center bg-danger-50 text-danger-500 rounded-xl"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div>
        <p className="section-header">
          Members ({activeMembers?.length ?? 0})
        </p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-1.5" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            activeMembers?.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0"
              >
                <div className="avatar w-10 h-10 text-sm shrink-0">
                  {getUserInitials(member.user)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">
                      {member.user.first_name} {member.user.last_name}
                    </p>
                    {member.user_id === currentUser?.id && (
                      <span className="text-xs text-gray-400">(you)</span>
                    )}
                  </div>
                  {member.child_names.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Kids: {member.child_names.join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full",
                      ROLE_COLORS[member.role]
                    )}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                  {isCoachOrAdmin && member.user_id !== currentUser?.id && (
                    <button
                      onClick={() => setRoleModalMember(member)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-6">
        <p className="section-header text-danger-500">Danger Zone</p>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 text-danger-500 font-semibold text-sm hover:text-danger-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave this team
          </button>
        </div>
      </div>

      {/* Role change modal */}
      {roleModalMember && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRoleModalMember(null)}
          />
          <div className="relative bg-white rounded-t-3xl w-full max-w-lg py-6">
            <h3 className="font-semibold text-gray-900 text-center mb-1">
              Change Role
            </h3>
            <p className="text-sm text-gray-400 text-center mb-4">
              {roleModalMember.user.first_name} {roleModalMember.user.last_name}
            </p>
            {(["parent", "coach", "admin"] as MemberRole[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  approveMutation.mutate({
                    userId: roleModalMember.user_id,
                    data: { role },
                  });
                  setRoleModalMember(null);
                }}
                className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  {ROLE_LABELS[role]}
                </span>
                {roleModalMember.role === role && (
                  <Check className="w-4 h-4 text-brand-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
