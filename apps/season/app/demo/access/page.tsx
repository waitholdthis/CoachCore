"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, LockKeyhole, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { authApi, teamsApi } from "@/lib/api";
import { setActiveTeam, setToken, setUser } from "@/lib/auth";

type DemoState = "loading" | "ready" | "blocked";

export default function DemoAccessPage() {
  const router = useRouter();
  const [state, setState] = useState<DemoState>("loading");
  const [message, setMessage] = useState("Preparing the Falcons U10 demo workspace…");

  useEffect(() => {
    let cancelled = false;

    async function launchDemo() {
      try {
        const res = await authApi.demoLogin();
        if (cancelled) return;
        setToken(res.access_token);
        setUser(res.user);
        setMessage("Demo account unlocked. Loading the seeded team…");

        const teams = await teamsApi.myTeams();
        if (cancelled) return;
        const falcons = teams.find((team) => team.invite_code === "FALCONU10") ?? teams[0];
        if (falcons) {
          setActiveTeam(falcons);
        }

        setState("ready");
        setMessage("Launching the live team command center…");
        window.setTimeout(() => router.replace("/messages"), 650);
      } catch (err: unknown) {
        if (cancelled) return;
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          "Demo access is not enabled yet. Seed the demo data and enable demo mode in a staging or local environment.";
        setState("blocked");
        setMessage(detail);
      }
    }

    launchDemo();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const isBlocked = state === "blocked";
  const isReady = state === "ready";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-5 py-8 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/demo" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to preview
        </Link>
        <Link href="/" className="text-sm font-black text-slate-500 hover:text-slate-950">The Season</Link>
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-5xl place-items-center py-12">
        <div className="w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/10 ring-1 ring-slate-200">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-slate-950 p-8 text-white sm:p-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-100">
                <ShieldCheck className="h-4 w-4 text-success-500" /> Guarded demo mode
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                One click into a real seeded team.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                This route turns The Season from a pretty preview into a live product walkthrough: demo token, active team selection, and a direct handoff into the app.
              </p>
              <div className="mt-8 grid gap-3 text-sm font-semibold text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Environment-gated so production cannot expose demo access by accident.</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Uses the Falcons U10 seed created for staging walkthroughs.</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Drops viewers into messages with the active team already selected.</div>
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-3xl ${isBlocked ? "bg-amber-50 text-amber-600" : "bg-brand-50 text-brand-600"}`}>
                {isBlocked ? <TriangleAlert className="h-8 w-8" /> : isReady ? <Sparkles className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}
              </div>

              <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-600">Demo access</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">
                {isBlocked ? "Demo mode is safely locked." : isReady ? "Demo workspace ready." : "Launching Falcons U10…"}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{message}</p>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-1 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-black text-slate-900">Required server flags</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Set <code className="rounded bg-white px-1.5 py-0.5 font-bold">SEASON_DEMO_ENABLED=true</code> in local/staging, keep <code className="rounded bg-white px-1.5 py-0.5 font-bold">ENVIRONMENT</code> away from production, then run the Falcons seed script.
                    </p>
                  </div>
                </div>
              </div>

              {isBlocked ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/demo" className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">View static demo</Link>
                  <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 hover:bg-white">Sign in manually</Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
