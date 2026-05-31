"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Calendar, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/messages",
    label: "Messages",
    Icon: MessageSquare,
  },
  {
    href: "/calendar",
    label: "Calendar",
    Icon: Calendar,
  },
  {
    href: "/uploads",
    label: "Photos",
    Icon: Image,
  },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar">
      {tabs.map(({ href, label, Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn("tab-item", isActive && "active")}
          >
            <Icon
              className={cn(
                "w-6 h-6",
                isActive ? "text-brand-600" : "text-gray-400"
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
