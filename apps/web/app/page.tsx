import Link from "next/link";
import { ArrowRight, BookOpen, Zap, GitCompare, MessageSquare, Shield } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Smart Rulebook",
    description: "Upload your league's PDF and get a single, merged rulebook with all local overrides clearly flagged.",
  },
  {
    icon: Zap,
    title: "Game-Day Quick Ref",
    description: "Scannable card with the 4 most critical rules: game length, ball size, roster minimum, timeouts.",
  },
  {
    icon: GitCompare,
    title: "Rule Diff Generator",
    description: "Traveling to an away tournament? See exactly what rules change — safety issues highlighted first.",
  },
  {
    icon: MessageSquare,
    title: "Sideline Chatbot",
    description: "Ask anything: \"Can the keeper pick up a backpass in U10 rec soccer?\" — instant, cited answer.",
  },
  {
    icon: Shield,
    title: "Safety Guardrails",
    description: "Pitch counts, weight limits, and concussion protocols are never silently overridden. Always verified.",
  },
];

const sports = [
  { emoji: "⚽", name: "Soccer", detail: "Heading bans, build-out lines, sub windows" },
  { emoji: "⚾", name: "Baseball", detail: "Pitch counts, rest days, bat certification" },
  { emoji: "🏀", name: "Basketball", detail: "Zone defense rules, press limits, clock format" },
  { emoji: "🏈", name: "Football", detail: "Weight limits, kickoff rules, mandatory play minutes" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-brand-700">CoachCore</span>
          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </div>
        <Link
          href="/dashboard"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          Open App <ArrowRight size={16} />
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          The rulebook every youth coach{" "}
          <span className="text-brand-600">actually needs</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          Upload your league's PDF. CoachCore ingests it, flags every conflict with the standard rules,
          and gives you one unified, always-accurate rulebook — on your phone, on the sideline.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-lg shadow-brand-200"
          >
            Get Started Free <ArrowRight size={20} />
          </Link>
          <Link href="/dashboard/chat" className="text-brand-600 font-medium flex items-center gap-2 hover:underline">
            Try the chatbot <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Sports Grid */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sports.map((s) => (
            <div key={s.name} className="bg-slate-50 rounded-2xl p-5 text-center border border-slate-100">
              <div className="text-4xl mb-2">{s.emoji}</div>
              <div className="font-semibold text-slate-800">{s.name}</div>
              <div className="text-xs text-slate-500 mt-1">{s.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Built for the sideline, not the boardroom</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <f.icon size={28} className="text-brand-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready for your next game?</h2>
        <p className="text-slate-500 mb-8">Set up your league in under 2 minutes. Baseline rules are already loaded.</p>
        <Link
          href="/dashboard"
          className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-colors inline-flex items-center gap-2 shadow-lg shadow-brand-200"
        >
          Open CoachCore <ArrowRight size={20} />
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        CoachCore — Youth Sports Rule Intelligence
      </footer>
    </div>
  );
}
