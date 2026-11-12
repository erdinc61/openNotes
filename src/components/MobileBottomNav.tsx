"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, BookOpen, Layers, Settings } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/pages", icon: FileText, label: "Pages" },
  { href: "/review", icon: BookOpen, label: "Review" },
  { href: "/decks", icon: Layers, label: "Decks" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on detail pages where we show a back header instead
  const isDetailPage =
    (pathname.startsWith("/pages/") && pathname !== "/pages") ||
    (pathname.startsWith("/decks/") && pathname !== "/decks") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/archive");

  if (isDetailPage) return null;

  return (
    <nav className="shrink-0 bg-background/80 backdrop-blur-lg border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
