"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ImageIcon } from "lucide-react";
import { updatePage } from "@/actions/pages";
import { uploadImage } from "@/actions/uploads";
import { EmojiPicker } from "@/components/EmojiPicker";
import { MobileBackHeader } from "@/components/MobileBackHeader";
import { PageEditor } from "@/components/editor/PageEditor";
import { ExportButton } from "@/components/pages/ExportButton";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

interface Ancestor {
  id: string;
  title: string;
  icon: string | null;
}

interface CoverData {
  url: string;
  y: number; // 0-100, vertical position percentage
}

function parseCover(raw: string | null): CoverData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.url) return { url: parsed.url, y: parsed.y ?? 50 };
  } catch { /* not JSON, treat as plain URL */ }
  return { url: raw, y: 50 };
}

function serializeCover(data: CoverData): string {
  return JSON.stringify({ url: data.url, y: data.y });
}

interface PageWrapperProps {
  pageId: string;
  initialContent: string;
  initialTitle: string;
  initialIcon: string | null;
  initialCover: string | null;
  ancestors: Ancestor[];
  decks: { id: string; name: string }[];
  userId: string;
}

export function PageWrapper({
  pageId, initialContent, initialTitle, initialIcon, initialCover,
  ancestors, decks, userId,
}: PageWrapperProps) {
  const router = useRouter();
  const [icon, setIcon] = useState(initialIcon);
  const [cover, setCover] = useState<CoverData | null>(() => parseCover(initialCover));
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverHover, setShowCoverHover] = useState(false);
  const [repositioning, setRepositioning] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState(50);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function handleIconChange(emoji: string | null) {
    setIcon(emoji);
    setShowEmojiPicker(false);
    await updatePage(pageId, { icon: emoji ?? undefined });
    router.refresh();
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { url } = await uploadImage(formData);
      const newCover: CoverData = { url, y: 50 };
      setCover(newCover);
      await updatePage(pageId, { coverImage: serializeCover(newCover) });
    } catch { /* silently fail */ }
    e.target.value = "";
  }

  async function handleRemoveCover() {
    setCover(null);
    setShowCoverHover(false);
    await updatePage(pageId, { coverImage: null });
  }

  function handleRepositionStart() {
    setRepositioning(true);
  }

  const handleDragStart = useCallback((clientY: number) => {
    setDragStartY(clientY);
    setDragStartPos(cover?.y ?? 50);
  }, [cover]);

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY === null || !cover) return;
    const delta = dragStartY - clientY;
    const newY = Math.max(0, Math.min(100, dragStartPos + delta * 0.3));
    setCover({ ...cover, y: newY });
  }, [dragStartY, dragStartPos, cover]);

  const handleDragEnd = useCallback(() => {
    setDragStartY(null);
  }, []);

  async function handleRepositionSave() {
    if (cover) {
      await updatePage(pageId, { coverImage: serializeCover(cover) });
    }
    setRepositioning(false);
  }

  return (
    <div>
      <MobileBackHeader />
      {/* Cover image */}
      {cover ? (
        <div
          className={`relative w-full h-40 md:h-52 group overflow-hidden ${repositioning ? "cursor-grab active:cursor-grabbing" : ""}`}
          onMouseEnter={() => !repositioning && setShowCoverHover(true)}
          onMouseLeave={() => { setShowCoverHover(false); setDragStartY(null); }}
          onMouseDown={repositioning ? (e) => { e.preventDefault(); handleDragStart(e.clientY); } : undefined}
          onMouseMove={repositioning ? (e) => handleDragMove(e.clientY) : undefined}
          onMouseUp={repositioning ? () => handleDragEnd() : undefined}
          onTouchStart={repositioning ? (e) => handleDragStart(e.touches[0].clientY) : undefined}
          onTouchMove={repositioning ? (e) => handleDragMove(e.touches[0].clientY) : undefined}
          onTouchEnd={repositioning ? () => handleDragEnd() : undefined}
        >
          <img
            src={cover.url}
            alt=""
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{ objectPosition: `center ${cover.y}%` }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />

          {repositioning ? (
            <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-3 py-2 bg-black/40 backdrop-blur-sm">
              <p className="text-xs text-white/80">Drag to reposition</p>
              <button
                onClick={handleRepositionSave}
                className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                Save position
              </button>
              <button
                onClick={() => { setCover(parseCover(initialCover)); setRepositioning(false); }}
                className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : showCoverHover && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={handleRepositionStart}
                className="px-3 py-1.5 text-xs rounded-lg bg-background/80 backdrop-blur hover:bg-background cursor-pointer transition-colors"
              >
                Reposition
              </button>
              <label className="px-3 py-1.5 text-xs rounded-lg bg-background/80 backdrop-blur hover:bg-background cursor-pointer transition-colors">
                Change cover
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
              <button
                onClick={handleRemoveCover}
                className="px-3 py-1.5 text-xs rounded-lg bg-background/80 backdrop-blur hover:bg-background transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-4 md:pt-16">
          <div className="opacity-0 hover:opacity-100 transition-opacity">
            <label className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-muted-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors">
              <ImageIcon className="size-3.5" />
              Add cover
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
        </div>
      )}

      <div className={`max-w-[900px] mx-auto px-4 md:px-8 ${cover ? "pt-4" : ""}`}>
        {/* Breadcrumbs */}
        {ancestors.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2 flex-wrap pt-2">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            {ancestors.map((a) => (
              <span key={a.id} className="flex items-center gap-1">
                <ChevronRight className="size-3" />
                <Link href={`/pages/${a.id}`} className="hover:text-foreground transition-colors truncate max-w-32">
                  {a.icon && <span className="mr-0.5">{a.icon}</span>}
                  {a.title || "Untitled"}
                </Link>
              </span>
            ))}
          </nav>
        )}

        {/* Icon + emoji picker + export */}
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-4xl md:text-5xl hover:bg-muted rounded-lg p-1 transition-colors"
              title="Change icon"
            >
              {icon ?? "📄"}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <EmojiPicker
                  currentEmoji={icon}
                  onSelect={handleIconChange}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>
          <div className="opacity-0 hover:opacity-100 transition-opacity mb-2">
            <ExportButton pageId={pageId} />
          </div>
        </div>
      </div>

      <PageEditor
        pageId={pageId}
        initialContent={initialContent}
        initialTitle={initialTitle}
        decks={decks}
        userId={userId}
      />
      <KeyboardShortcuts />
    </div>
  );
}
