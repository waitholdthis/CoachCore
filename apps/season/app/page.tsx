import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";

const painPoints = [
  "Parents asking the same question in three different threads",
  "Practice changes buried under old texts",
  "Game-day RSVPs scattered across messages and memory",
  "Volunteer coaches doing admin work after already giving their time",
];

const features = [
  {
    icon: MessageCircle,
    title: "Team messages without the noise",
    copy: "Keep announcements, team chat, and direct messages organized by season and team.",
  },
  {
    icon: CalendarDays,
    title: "Practice and game calendar",
    copy: "Publish the schedule, collect RSVPs, and keep families aligned when plans change.",
  },
  {
    icon: FileText,
    title: "Files parents can actually find",
    copy: "Upload photos, PDFs, forms, snack lists, play sheets, and league documents in one place.",
  },
  {
    icon: UsersRound,
    title: "Simple team membership",
    copy: "Invite families with a code, approve members, and keep roles clear for coaches and parents.",
  },
];

const demoMessages = [
  { name: "Coach Parker", text: "Practice moved to Field 3 tonight. Same time: 6:00 PM.", tone: "coach" },
  { name: "Maya R.", text: "Jaxon is in for Saturday. We can bring waters.", tone: "parent" },
  { name: "Coach Parker", text: "Perfect. I uploaded the game-day rotation sheet too.", tone: "coach" },
];

const schedule = [
  { type: "Practice", day: "Tue", time: "6:00 PM", note: "Field 3 · bring cleats" },
  { type: "Game", day: "Sat", time: "9:30 AM", note: "Arrive 30 min early" },
  { type: "Team", day: "Sun", time: "4:00 PM", note: "Snack signup closes" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <section className="relative isolate px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(74,144,217,0.35),transparent_32%),radial-gradient(circle_at_85%_0%,rgba(244,162,97,0.28),transparent_30%),linear-gradient(180deg,#07111f_0%,#0e1d31_100%)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3" aria-label="The Season home">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none tracking-tight">The Season</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">Coach Command Center</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#demo" className="hover:text-white">Demo</a>
            <a href="#launch" className="hover:text-white">Launch plan</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:text-white sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-white/10 transition hover:-translate-y-0.5 hover:bg-brand-50">
              Start free
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Built for volunteer coaches
            </div>
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
              One calm command center for the chaos of youth sports season.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              The Season helps coaches and parent volunteers keep messages, schedules, RSVPs, team files, and family updates in one simple place.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-4 text-base font-black text-white shadow-2xl shadow-brand-500/25 transition hover:-translate-y-1 hover:bg-brand-600">
                View demo team
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-base font-bold text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/14">
                Create a team
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              No pitch deck needed. Start with one team, one season, one cleaner way to communicate.
            </p>
          </div>

          <div id="demo" className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/35 via-white/10 to-amber-500/25 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-slate-950/88 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="rounded-[1.5rem] bg-slate-100 text-slate-950 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Saturday ready</p>
                    <h2 className="text-xl font-black tracking-tight">Falcons U10</h2>
                  </div>
                  <div className="rounded-full bg-success-100 px-3 py-1 text-xs font-black text-success-600">18 / 22 RSVP</div>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-[1fr_0.86fr]">
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-black">Team Chat</p>
                        <Megaphone className="h-4 w-4 text-brand-500" />
                      </div>
                      <div className="space-y-3">
                        {demoMessages.map((message) => (
                          <div key={`${message.name}-${message.text}`} className={message.tone === "coach" ? "rounded-2xl rounded-br-md bg-brand-500 px-3 py-2 text-white" : "rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2 text-slate-800"}>
                            <p className="text-[11px] font-bold opacity-70">{message.name}</p>
                            <p className="text-sm leading-5">{message.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-sm">
                      <p className="mb-3 text-sm font-black">Coach checklist</p>
                      <div className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success-500" /> Rotation sheet uploaded</div>
                        <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-500" /> 4 RSVPs still pending</div>
                        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-100" /> Parent list approved</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {schedule.map((item) => (
                      <div key={`${item.day}-${item.type}`} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-brand-600">{item.type}</p>
                            <p className="mt-1 text-lg font-black">{item.day} · {item.time}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                          </div>
                          <CalendarDays className="h-5 w-5 text-slate-300" />
                        </div>
                      </div>
                    ))}
                    <div className="rounded-2xl bg-amber-50 p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-600">
                        <Trophy className="h-5 w-5" />
                        <p className="text-sm font-black">Game-day mode</p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">The next sprint will turn this into a real demo flow with seeded team data and zero-friction preview access.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 text-slate-950 sm:px-8 lg:px-12" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-600">Why it exists</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Volunteer coaches need less admin, not another noisy app.</h2>
              <div className="mt-8 space-y-3">
                {painPoints.map((pain) => (
                  <div key={pain} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                    <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" />
                    <p className="text-sm font-semibold text-slate-700">{pain}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-[1.7rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{feature.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-slate-950 sm:px-8 lg:px-12" id="launch">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-10 lg:grid-cols-[1fr_0.8fr] lg:p-12">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-500">Publishing sprint</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">First, make it useful for one real team.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              The strongest MVP is not every league feature. It is one team running one season with fewer missed updates, fewer repeat questions, and a coach who feels in control.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
            <p className="mb-4 text-sm font-black uppercase tracking-wide text-white/60">Next build targets</p>
            <div className="space-y-3">
              {["Privacy and terms", "Seeded demo team", "Email/password recovery", "Production deployment", "Tootie Designs case study"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-black">{index + 1}</span>
                  <span className="text-sm font-semibold text-slate-200">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/demo" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-brand-50">
              Open the product demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The Season. Built for calmer youth sports coordination.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="font-semibold hover:text-white">Privacy</Link>
            <Link href="/terms" className="font-semibold hover:text-white">Terms</Link>
            <Link href="/demo" className="font-semibold hover:text-white">Demo</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
