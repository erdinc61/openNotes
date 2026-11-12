"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, MoreHorizontal, Archive, MoveRight, Star, Trash2 } from "lucide-react";
import { archivePage, deletePage, movePage } from "@/actions/pages";
import { toggleFavorite } from "@/actions/favorites";
import { useRouter } from "next/navigation";

import type { PageNode } from "@/lib/page-tree";

interface PageTreeProps {
  pages: PageNode[];
  userId: string;
}

function PageTreeNode({ node, depth = 0, allPages }: { node: PageNode; depth?: number; allPages: PageNode[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const isActive = pathname === `/pages/${node.id}`;
  const hasChildren = node.children.length > 0;

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    await toggleFavorite(node.id, !node.isFavorite);
    router.refresh();
  }

  async function handleArchive(e: React.MouseEvent) {
    e.preventDefault();
    await archivePage(node.id);
    router.refresh();
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    await deletePage(node.id);
    router.refresh();
  }

  async function handleMoveTo(newParentId: string | null) {
    try {
      await movePage(node.id, newParentId);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Move failed");
    }
    setShowMoveModal(false);
  }

  return (
    <div>
      <div
        className={`group relative flex items-center gap-1.5 rounded-xl transition-colors duration-100 hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80"}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-1 rounded transition-transform duration-150 ${expanded ? "rotate-90" : ""} ${hasChildren ? "opacity-60 hover:opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight className="size-5" />
        </button>
        <Link href={`/pages/${node.id}`} className="flex items-center gap-2.5 flex-1 py-2 min-w-0">
          <span className="text-lg shrink-0">{node.icon ?? "📄"}</span>
          <span className="text-lg truncate">{node.title || "Untitled"}</span>
        </Link>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-xl hover:bg-sidebar-accent ${node.isFavorite ? "opacity-100 text-yellow-500" : ""}`}
            title={node.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`size-5 ${node.isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-xl hover:bg-sidebar-accent"
          >
            <MoreHorizontal className="size-5" />
          </button>
          {showMenu && (
            <div
              className="absolute right-1 top-full z-50 w-44 rounded-xl border border-border bg-popover shadow-lg py-1"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={(e) => { handleArchive(e); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-lg hover:bg-muted rounded-xl transition-colors"
              >
                <Archive className="size-5" />
                Archive
              </button>
              <button
                onClick={() => { setShowMoveModal(true); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-lg hover:bg-muted rounded-xl transition-colors"
              >
                <MoveRight className="size-5" />
                Move to...
              </button>
              <button
                onClick={(e) => { handleDelete(e); setShowMenu(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-lg hover:bg-muted rounded-xl transition-colors text-destructive"
              >
                <Trash2 className="size-5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <PageTreeNode key={child.id} node={child} depth={depth + 1} allPages={allPages} />
          ))}
        </div>
      )}

      {showMoveModal && (
        <MoveModal
          currentId={node.id}
          pages={allPages}
          onMove={handleMoveTo}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </div>
  );
}

function MoveModal({
  currentId,
  pages,
  onMove,
  onClose,
}: {
  currentId: string;
  pages: PageNode[];
  onMove: (newParentId: string | null) => void;
  onClose: () => void;
}) {
  const flatPages = flattenPages(pages).filter((p) => p.id !== currentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl p-6 w-96 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-medium mb-4">Move to…</p>
        <button
          onClick={() => onMove(null)}
          className="w-full text-left px-4 py-3 rounded-xl text-lg hover:bg-muted"
        >
          Root (no parent)
        </button>
        {flatPages.map((p) => (
          <button
            key={p.id}
            onClick={() => onMove(p.id)}
            className="w-full text-left px-4 py-3 rounded-xl text-lg hover:bg-muted truncate"
          >
            {p.icon ?? "📄"} {p.title || "Untitled"}
          </button>
        ))}
      </div>
    </div>
  );
}

function flattenPages(nodes: PageNode[]): PageNode[] {
  return nodes.flatMap((n) => [n, ...flattenPages(n.children)]);
}

type SortMode = "alpha" | "modified" | "created";

function sortPages(pages: PageNode[], mode: SortMode): PageNode[] {
  const sorted = [...pages];
  switch (mode) {
    case "alpha":
      sorted.sort((a, b) => (a.title || "Untitled").localeCompare(b.title || "Untitled"));
      break;
    case "modified":
    case "created":
      // Default order from server (already newest first)
      break;
  }
  return sorted.map((p) => ({ ...p, children: sortPages(p.children, mode) }));
}

export function PageTree({ pages, userId }: PageTreeProps) {
  const [sortMode, setSortMode] = useState<SortMode>("modified");
  const sortedPages = sortPages(pages, sortMode);

  if (pages.length === 0) {
    return <p className="text-lg text-muted-foreground px-4 py-2">No pages yet</p>;
  }

  return (
    <div className="space-y-0.5">
      <div className="flex justify-end px-2 mb-1">
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="text-xs bg-transparent text-muted-foreground/60 hover:text-muted-foreground cursor-pointer focus:outline-none"
        >
          <option value="modified">Recent</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>
      {sortedPages.map((node) => (
        <PageTreeNode key={node.id} node={node} allPages={sortedPages} />
      ))}
    </div>
  );
}
