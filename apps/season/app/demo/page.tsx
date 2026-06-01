import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Upload,
  UsersRound,
} from "lucide-react";

const messages = [
  { who: "Coach Parker", time: "8:12 AM", text: "Reminder: blue jerseys Saturday. Please RSVP by tonight so we can lock rotations.", own: true },
  { who: "Maya R.", time: "8:17 AM", text: "Jaxon is confirmed. We can bring fruit and waters.", own: false },
  { who: "D. Carter", time: "8:23 AM", text: "Ava may be 10 minutes late to practice, but she is in for the game.", own: false },
  { who: "Coach Parker", time: "8:31 AM", text: "All good. I uploaded the rotation sheet under Team Files.", own: true },
];

const events = [
  { label: "Practice", date: "Tonight", time: "6:00 PM", meta: "Field 3 · Footwork + small-sided games", status: "20 going" },
  { label: "Game", date: "Saturday", time: "9:30 AM", meta: "Arrive by 9:00 · Blue jerseys", status: "18 / 22 RSVP" },
  { label: "Team reminder", date: "Sunday", time: "4:00 PM", meta: "Snack signup and picture forms due", status: "Pinned" },
];

const files = [
  { name: "Game-day rotation sheet.pdf", type: "PDF", size: "216 KB" },
  { name: "Field map.png", type: "Image", size: "1.4 MB" },
  { name: "Parent snack signup.pdf", type: "PDF", size: "98 KB" },
];

const parents = ["Maya R.", "D. Carter", "J. Wilson", "Sam T.", "Nina B.", "L. Howard"];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> Back to landing
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-950 sm:inline-flex">Sign in</Link>
            <Link href="/register" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600">Create team</Link>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <div className="mb-6 rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-brand-100">
                <ShieldCheck className="h-4 w-4 text-success-500" /> Demo Team Preview
              </div>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Falcons U10 command center</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                This is the product shape: a calm game-week dashboard where coaches can see messages, RSVPs, schedule changes, files, and parent readiness at a glance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={UsersRound} label="Families" value="22" />
              <Metric icon={ClipboardCheck} label="RSVPs" value="18" />
              <Metric icon={MessageCircle} label="Unread" value="4" />
              <Metric icon={CheckCircle2} label="Ready" value="82%" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Team chat</p>
                <h2 className="text-2xl font-black tracking-tight">Saturday game thread</h2>
              </div>
              <Megaphone className="h-6 w-6 text-brand-500" />
            </div>
            <div className="space-y-3">
              {messages.map((message) => (
                <div key={`${message.who}-${message.time}`} className={`flex ${message.own ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] rounded-3xl px-4 py-3 ${message.own ? "rounded-br-md bg-brand-500 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"}`}>
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-black opacity-70">
                      <span>{message.who}</span>
                      <span>{message.time}</span>
                    </div>
                    <p className="text-sm leading-6">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              Demo note: this static preview now matches the Falcons U10 backend seed data used for staging walkthroughs and screenshot-ready product demos.
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-brand-500" />
                <h2 className="text-xl font-black tracking-tight">This week</h2>
              </div>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.label} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-brand-600">{event.label}</p>
                        <p className="mt-1 text-lg font-black">{event.date} · {event.time}</p>
                        <p className="mt-1 text-sm text-slate-500">{event.meta}</p>
                      </div>
                      <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-black text-success-600">{event.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-brand-500" />
                  <h2 className="text-xl font-black tracking-tight">Team files</h2>
                </div>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.type} · {file.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-amber-500" />
                  <h2 className="text-xl font-black tracking-tight">Coach pulse</h2>
                </div>
                <div className="space-y-3">
                  <Pulse label="Need RSVP" value="4 families" tone="amber" />
                  <Pulse label="Snack slot" value="Filled" tone="green" />
                  <Pulse label="Forms" value="3 missing" tone="red" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {parents.map((name) => (
                    <span key={name} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200">{name}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Demo data is fictional and designed for product preview.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="font-bold hover:text-slate-950">Privacy</Link>
            <Link href="/terms" className="font-bold hover:text-slate-950">Terms</Link>
            <Link href="/register" className="font-bold hover:text-slate-950">Create team</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
      <Icon className="mb-3 h-5 w-5 text-brand-100" />
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-white/45">{label}</p>
    </div>
  );
}

function Pulse({ label, value, tone }: { label: string; value: string; tone: "amber" | "green" | "red" }) {
  const color = tone === "green" ? "bg-success-500" : tone === "red" ? "bg-danger-500" : "bg-amber-500";
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/8 p-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-black">{value}</span>
    </div>
  );
}
