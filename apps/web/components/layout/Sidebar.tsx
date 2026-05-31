"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Upload, Zap, GitCompare, MessageSquare, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/leagues", label: "My Leagues", icon: Users },
  { href: "/dashboard/chat", label: "Rule Check", icon: MessageSquare },
  { href: "/dashboard/diff", label: "Rule Diff", icon: GitCompare },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
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
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
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
