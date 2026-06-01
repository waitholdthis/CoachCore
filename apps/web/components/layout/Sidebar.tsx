"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Dumbbell,
  BookOpen,
  BarChart2,
  Map,
  Users,
  TrendingUp,
  Activity,
  Lightbulb,
  Bookmark,
  MessageSquare,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const planningItems = [
  { href: "/dashboard/calendar", label: "Practice Calendar", icon: Calendar },
  { href: "/dashboard/practice", label: "Practice Builder", icon: Dumbbell },
  { href: "/dashboard/drills", label: "Drill Library", icon: BookOpen },
  { href: "/dashboard/seasons", label: "Season Planning", icon: BarChart2 },
  { href: "/dashboard/gameplan", label: "Tactical Board", icon: Map },
];

const teamItems = [
  { href: "/dashboard/team", label: "Team Management", icon: Users },
  { href: "/dashboard/performance", label: "Performance", icon: TrendingUp },
  { href: "/dashboard/conditioning", label: "S&C Engine", icon: Activity },
];

const resourceItems = [
  { href: "/dashboard/resources", label: "Motivational Hub", icon: Lightbulb },
  { href: "/dashboard/saved", label: "Saved Resources", icon: Bookmark },
  { href: "/dashboard/leagues", label: "My Leagues", icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "Rule Check", icon: MessageSquare },
  { href: "/dashboard/diff", label: "Rule Diff", icon: GitCompare },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive(href)
            ? "bg-brand-50 text-brand-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  }

  function SectionLabel({ label }: { label: string }) {
    return (
      <div className="pt-5 pb-1">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium px-3">{label}</p>
      </div>
    );
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-700">CoachCore</span>
          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Beta</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <SectionLabel label="Planning" />
        {planningItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <SectionLabel label="Team" />
        {teamItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <SectionLabel label="Resources" />
        {resourceItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs font-medium text-slate-600">Need help?</p>
          <p className="text-xs text-slate-400 mt-0.5">Ask the Rule Check chatbot</p>
          <Link
            href="/dashboard/chat"
            className="text-xs text-brand-600 font-medium mt-1 inline-block hover:underline"
          >
            Open chatbot →
          </Link>
        </div>
      </div>
    </aside>
  );
}
