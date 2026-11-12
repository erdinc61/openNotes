"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Layers, Settings, Archive, Search, Star, LogOut, BarChart3 } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { toggleFavorite } from "@/actions/favorites";
import { useRef, useState, useEffect } from "react";

interface SidebarProps {
  dueCount: number;
  pageTree?: React.ReactNode;
  favoritePages?: { id: string; title: string; icon: string | null }[];
}

export function Sidebar({ dueCount, pageTree, favoritePages = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    }, 300);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-4 px-4 py-2.5 rounded-xl text-lg transition-colors duration-100 ${
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Link href="/" className="text-xl font-semibold tracking-tight text-sidebar-foreground/90">
          openNotes
        </Link>
      </div>

      {/* Search trigger */}
      <div className="px-4 py-2">
        {searchOpen ? (
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-sidebar-accent text-lg">
            <Search className="size-6 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search..."
              className="flex-1 bg-transparent focus:outline-none text-lg placeholder:text-muted-foreground"
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-4 w-full px-4 py-2.5 rounded-xl text-lg text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors duration-100"
          >
            <Search className="size-6 shrink-0" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-sm text-sidebar-foreground/40 bg-sidebar-accent rounded px-2 py-0.5 font-sans hidden sm:inline">
              Ctrl K
            </kbd>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="px-4 space-y-1">
        <Link href="/review" className={navLinkClass(pathname === "/review")}>
          <BookOpen className="size-6 shrink-0" />
          <span className="flex-1">Review</span>
          {dueCount > 0 && (
            <span className="text-sm bg-primary/15 text-primary rounded-full px-2.5 py-0.5 min-w-[1.75rem] text-center font-medium">
              {dueCount}
            </span>
          )}
        </Link>
        <Link href="/decks" className={navLinkClass(pathname.startsWith("/decks"))}>
          <Layers className="size-6 shrink-0" />
          <span>Decks</span>
        </Link>
        <Link href="/stats" className={navLinkClass(pathname === "/stats")}>
          <BarChart3 className="size-6 shrink-0" />
          <span>Stats</span>
        </Link>
      </nav>

      {/* Favorites */}
      {favoritePages.length > 0 && (
        <div className="px-4 mt-6">
          <p className="px-4 pb-2 text-sm font-medium text-sidebar-foreground/40 uppercase tracking-wider">
            Favorites
          </p>
          <div className="space-y-0.5">
            {favoritePages.map((p) => (
              <div key={p.id} className="group relative flex items-center">
                <Link
                  href={`/pages/${p.id}`}
                  className={navLinkClass(pathname === `/pages/${p.id}`) + " flex-1 min-w-0"}
                >
                  <span className="text-lg shrink-0">{p.icon ?? "📄"}</span>
                  <span className="truncate">{p.title || "Untitled"}</span>
                </Link>
                <button
                  onClick={async () => { await toggleFavorite(p.id, false); router.refresh(); }}
                  className="absolute right-2 p-1.5 rounded-xl hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from favorites"
                >
                  <Star className="size-5 fill-yellow-500 text-yellow-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages */}
      <div className="flex-1 overflow-y-auto px-4 mt-6">
        <p className="px-4 pb-2 text-sm font-medium text-sidebar-foreground/40 uppercase tracking-wider">
          Pages
        </p>
        {pageTree ?? (
          <p className="text-lg text-muted-foreground px-4 py-2">No pages yet</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 space-y-1">
        <Link href="/archive" className={navLinkClass(pathname === "/archive")}>
          <Archive className="size-6 shrink-0" />
          <span>Archive</span>
        </Link>
        <Link href="/settings" className={navLinkClass(pathname === "/settings")}>
          <Settings className="size-6 shrink-0" />
          <span>Settings</span>
        </Link>
        <button onClick={handleSignOut} className={navLinkClass(false) + " w-full"}>
          <LogOut className="size-6 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - always visible */}
      <aside
        className="hidden md:flex md:flex-col w-80 bg-sidebar shrink-0 select-none overflow-y-auto md:sticky md:top-0 md:h-screen"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
