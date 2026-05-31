"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { teamsApi } from "@/lib/api";
import { getToken, setActiveTeam } from "@/lib/auth";
import { CheckCircle, Users } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(`/register?invite_code=${code}`);
      return;
    }

    // Auto-join on load
    setStatus("loading");
    teamsApi
      .join(code)
      .then((member) => {
        setStatus("success");
        // Try to refresh team and set as active
        teamsApi
          .get(member.team_id)
          .then((team) => {
            setActiveTeam(team);
          })
          .catch(() => {});
      })
      .catch((err: unknown) => {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail ?? "Failed to join team";
        if (
          detail.toLowerCase().includes("already") ||
          detail.toLowerCase().includes("member")
        ) {
          setErrorMsg("already_member");
        } else {
          setErrorMsg(detail);
        }
        setStatus("error");
      });
  }, [code, router]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Joining team…</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-success-50 px-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Submitted!
          </h1>
          <p className="text-gray-600 mb-6">
            Your request to join the team has been submitted. A coach will
            approve you shortly.
          </p>
          <button
            onClick={() => router.replace("/messages")}
            className="btn-primary"
          >
            Go to Messages
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (errorMsg === "already_member") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 px-4">
        <div className="text-center max-w-sm">
          <Users className="w-16 h-16 text-brand-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Already a Member
          </h1>
          <p className="text-gray-600 mb-6">
            You&apos;re already part of this team.
          </p>
          <button
            onClick={() => router.replace("/messages")}
            className="btn-primary"
          >
            Go to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-danger-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Unable to Join
        </h1>
        <p className="text-gray-600 mb-6">{errorMsg}</p>
        <button
          onClick={() => router.replace("/messages")}
          className="btn-secondary"
        >
          Back to App
        </button>
      </div>
    </div>
  );
}
