import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileWarning, Handshake, ShieldCheck, UsersRound } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use | The Season",
  description:
    "Prelaunch terms for using The Season, a youth sports team communication and season coordination product.",
};

const terms = [
  {
    title: "Use The Season for team coordination",
    copy:
      "The Season is intended to help coaches, parents, guardians, and approved volunteers coordinate messages, schedules, RSVPs, files, and membership for a youth sports team or season.",
  },
  {
    title: "Account and team responsibility",
    copy:
      "Coaches and team administrators are responsible for inviting the right members, keeping team information accurate, removing people who should no longer have access, and using appropriate judgment before sharing files or messages.",
  },
  {
    title: "Respectful communication",
    copy:
      "Users should communicate respectfully and should not post harassment, threats, illegal content, spam, private information that does not belong in a team app, or material that violates another person's rights.",
  },
  {
    title: "Youth safety expectations",
    copy:
      "The Season should not be used to bypass league, school, organizational, or parental rules. Teams should follow their own safeguarding policies and keep adult-to-youth communication aligned with the standards required by their league or organization.",
  },
  {
    title: "Uploads and content",
    copy:
      "Users should only upload content they have the right to share with the team. Production operators may remove content or restrict access if needed to protect the product, the team, or other users.",
  },
  {
    title: "Prelaunch product status",
    copy:
      "The Season is currently moving through a product-readiness sprint. Features, availability, pricing, support channels, and production policies may change before broad public launch.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-white/8 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to The Season
          </Link>
          <Link href="/privacy" className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-brand-50">
            Privacy
          </Link>
        </div>
      </header>

      <section className="relative isolate mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="absolute left-1/2 top-12 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="rounded-[2.25rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-100">
            <Handshake className="h-4 w-4 text-amber-500" /> Team operating rules
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">Terms for a calmer, safer team command center.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            These terms frame how The Season should be used while it is prepared for real teams: practical coordination, respectful communication, clear admin responsibility, and family-aware product standards.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Principle icon={UsersRound} label="Approved team members" />
            <Principle icon={ShieldCheck} label="Family-aware usage" />
            <Principle icon={CheckCircle2} label="Coach-admin clarity" />
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {terms.map((term, index) => (
            <article key={term.title} className="rounded-[1.5rem] border border-white/10 bg-white p-6 text-slate-950 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-sm font-black text-brand-600">
                {index + 1}
              </div>
              <h2 className="text-2xl font-black tracking-tight">{term.title}</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">{term.copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/8 p-6 text-slate-200">
          <div className="flex items-start gap-3">
            <FileWarning className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white">Prelaunch note</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This page is not legal advice and should be reviewed before public production use. It exists now because any youth sports product that touches family communication, uploads, schedules, and team membership needs trust scaffolding early.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Principle({ icon: Icon, label }: { icon: typeof UsersRound; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
      <Icon className="mb-3 h-5 w-5 text-brand-100" />
      <p className="text-sm font-black text-white">{label}</p>
    </div>
  );
}
