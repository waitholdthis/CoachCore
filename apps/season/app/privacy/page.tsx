import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, LockKeyhole, Mail, ShieldCheck, UsersRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | The Season",
  description:
    "How The Season handles team, family, schedule, message, and file information for youth sports coaches and parents.",
};

const sections = [
  {
    title: "Information teams add",
    copy:
      "The Season is designed for coaches and families to coordinate a youth sports season. Teams may add coach names, parent or guardian names, email addresses, player display names, team schedules, RSVP status, messages, uploaded files, and similar season coordination details.",
  },
  {
    title: "How the information is used",
    copy:
      "Information is used to operate the product: helping teams communicate, publish schedules, manage RSVPs, share files, invite members, protect accounts, troubleshoot support requests, and improve the app experience.",
  },
  {
    title: "Youth and family data",
    copy:
      "The Season is built with the expectation that youth sports teams include children and family information. Coaches should only invite appropriate parents, guardians, and team volunteers, and should avoid uploading sensitive medical, financial, or government-identification information unless a future production policy explicitly supports it.",
  },
  {
    title: "Files and messages",
    copy:
      "Team files and messages are intended for the members of the team or season they belong to. Production deployments should use private storage, authenticated access, secure transport, and role-based access controls before public launch.",
  },
  {
    title: "Service providers",
    copy:
      "A production deployment may rely on managed infrastructure for hosting, database storage, file storage, email delivery, monitoring, analytics, and security. Those providers should only be used to run, protect, and improve The Season.",
  },
  {
    title: "Prelaunch status",
    copy:
      "This policy is a product-readiness draft for The Season. Before accepting real teams at scale, the final operator should review this policy with qualified counsel, connect it to the actual production infrastructure, and publish the effective date and contact address.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> Back to The Season
          </Link>
          <Link href="/terms" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-brand-600">
            Terms
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-[2.25rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-100">
            <ShieldCheck className="h-4 w-4 text-success-500" /> Product readiness draft
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">Privacy built for teams, families, and calmer seasons.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            The Season should earn trust before it asks a coach or parent to bring a real team inside. This page explains the intended data posture for the product while it moves from showcase sprint to production launch.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <TrustCard icon={UsersRound} label="Team-scoped access" />
            <TrustCard icon={LockKeyhole} label="Private files by default" />
            <TrustCard icon={Mail} label="Clear contact path before launch" />
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <FileText className="h-5 w-5" />
                </span>
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{section.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Important</p>
          <p className="mt-2 text-sm leading-6">
            This is not legal advice. It is a product-readiness baseline so The Season has a trustworthy public surface before real youth sports teams are invited into production.
          </p>
        </div>
      </section>
    </main>
  );
}

function TrustCard({ icon: Icon, label }: { icon: typeof UsersRound; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
      <Icon className="mb-3 h-5 w-5 text-brand-100" />
      <p className="text-sm font-black text-white">{label}</p>
    </div>
  );
}
