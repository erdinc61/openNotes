"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { CreateCardModal } from "@/components/flashcard/CreateCardModal";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  BookOpen,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  CheckSquare,
  ChevronDown,
  Minus,
} from "lucide-react";

interface SelectionToolbarProps {
  editor: Editor | null;
  decks: { id: string; name: string }[];
  userId: string;
  pageId: string;
}

const COLORS = [
  { name: "Default", color: null },
  { name: "Red", color: "#ff4d4d" },
  { name: "Orange", color: "#ffa94d" },
  { name: "Yellow", color: "#ffd43b" },
  { name: "Green", color: "#51cf66" },
  { name: "Blue", color: "#339af0" },
  { name: "Purple", color: "#b197fc" },
  { name: "Pink", color: "#f06595" },
];

const BG_COLORS = [
  { name: "Default", color: null },
  { name: "Red", color: "rgba(255,77,77,0.15)" },
  { name: "Orange", color: "rgba(255,169,77,0.15)" },
  { name: "Yellow", color: "rgba(255,212,59,0.15)" },
  { name: "Green", color: "rgba(81,207,102,0.15)" },
  { name: "Blue", color: "rgba(51,154,240,0.15)" },
  { name: "Purple", color: "rgba(177,151,252,0.15)" },
  { name: "Pink", color: "rgba(240,101,149,0.15)" },
];

const TURN_INTO = [
  { label: "Text", icon: Type, action: (e: Editor) => e.chain().focus().setParagraph().run() },
  { label: "Heading 1", icon: Heading1, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2", icon: Heading2, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3", icon: Heading3, action: (e: Editor) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bullet List", icon: List, action: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { label: "Numbered List", icon: ListOrdered, action: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { label: "To-do List", icon: CheckSquare, action: (e: Editor) => e.chain().focus().toggleTaskList().run() },
  { label: "Quote", icon: Quote, action: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { label: "Code Block", icon: CodeSquare, action: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Divider", icon: Minus, action: (e: Editor) => e.chain().focus().setHorizontalRule().run() },
];

export function SelectionToolbar({ editor, decks, userId, pageId }: SelectionToolbarProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [showTurnInto, setShowTurnInto] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const closeDropdowns = useCallback(() => {
    setShowTurnInto(false);
    setShowColorPicker(false);
    setShowLinkInput(false);
  }, []);

  useEffect(() => {
    if (!editor) return;

    function updateToolbar() {
      const { from, to } = editor!.state.selection;
      const hasSelection = from !== to;

      if (!hasSelection) {
        setToolbarPos(null);
        closeDropdowns();
        return;
      }

      const text = editor!.state.doc.textBetween(from, to, " ");
      setSelectedText(text);

      try {
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) return;
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setToolbarPos({
          top: rect.top + window.scrollY - 48,
          left: rect.left + window.scrollX + rect.width / 2,
        });
      } catch {
        setToolbarPos(null);
      }
    }

    editor.on("selectionUpdate", updateToolbar);
    return () => {
      editor.off("selectionUpdate", updateToolbar);
    };
  }, [editor, closeDropdowns]);

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  function handleLink() {
    if (!editor) return;
    const existing = editor.getAttributes("link").href;
    if (existing) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
    } else {
      setLinkUrl("");
      setShowLinkInput(true);
      setShowTurnInto(false);
      setShowColorPicker(false);
    }
  }

  function submitLink() {
    if (!editor || !linkUrl.trim()) return;
    const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url }).run();
    setShowLinkInput(false);
    setLinkUrl("");
  }

  function getCurrentBlockLabel(): string {
    if (!editor) return "Text";
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    if (editor.isActive("bulletList")) return "List";
    if (editor.isActive("orderedList")) return "Num";
    if (editor.isActive("taskList")) return "To-do";
    if (editor.isActive("blockquote")) return "Quote";
    if (editor.isActive("codeBlock")) return "Code";
    return "Text";
  }

  if (!toolbarPos || !selectedText.trim() || showModal) return (
    <>
      {showModal && (
        <CreateCardModal
          initialFront={selectedText}
          decks={decks}
          userId={userId}
          sourcePageId={pageId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );

  return (
    <>
      <div
        ref={toolbarRef}
        className="fixed z-40 -translate-x-1/2 flex items-center rounded-lg border border-border bg-popover shadow-lg"
        style={{ top: toolbarPos.top, left: toolbarPos.left }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Turn Into dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowTurnInto(!showTurnInto); setShowColorPicker(false); setShowLinkInput(false); }}
            className="flex items-center gap-0.5 px-2.5 py-1.5 text-sm hover:bg-muted transition-colors rounded-l-lg border-r border-border"
          >
            <span className="text-xs font-medium">{getCurrentBlockLabel()}</span>
            <ChevronDown className="size-3" />
          </button>
          {showTurnInto && (
            <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-lg border border-border bg-popover shadow-lg z-50">
              {TURN_INTO.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(editor!); setShowTurnInto(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            icon={Link}
            active={editor?.isActive("link") ?? false}
            onClick={handleLink}
          />
          {showLinkInput && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex items-center gap-1 p-1.5 rounded-lg border border-border bg-popover shadow-lg z-50">
              <input
                ref={linkInputRef}
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitLink(); if (e.key === "Escape") setShowLinkInput(false); }}
                placeholder="Paste link..."
                className="w-52 px-2.5 py-1 text-sm bg-transparent border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Inline formatting */}
        <ToolbarButton
          icon={Bold}
          active={editor?.isActive("bold") ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          active={editor?.isActive("italic") ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={Underline}
          active={editor?.isActive("underline") ?? false}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={Strikethrough}
          active={editor?.isActive("strike") ?? false}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          icon={Code}
          active={editor?.isActive("code") ?? false}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        />

        <div className="h-5 w-px bg-border" />

        {/* Color picker */}
        <div className="relative">
          <ToolbarButton
            icon={Highlighter}
            active={showColorPicker}
            onClick={() => { setShowColorPicker(!showColorPicker); setShowTurnInto(false); setShowLinkInput(false); }}
          />
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 w-48 p-2 rounded-lg border border-border bg-popover shadow-lg z-50">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">Text color</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      if (c.color) {
                        editor?.chain().focus().setColor(c.color).run();
                      } else {
                        editor?.chain().focus().unsetColor().run();
                      }
                    }}
                    className="size-6 rounded-md border border-border hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c.color ?? "transparent" }}
                    title={c.name}
                  >
                    {!c.color && <span className="text-xs text-muted-foreground">A</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">Background</p>
              <div className="flex flex-wrap gap-1">
                {BG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      if (c.color) {
                        editor?.chain().focus().toggleHighlight({ color: c.color }).run();
                      } else {
                        editor?.chain().focus().unsetHighlight().run();
                      }
                    }}
                    className="size-6 rounded-md border border-border hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: c.color ?? "transparent" }}
                    title={c.name}
                  >
                    {!c.color && <span className="text-xs text-muted-foreground">A</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Create Flashcard */}
        <button
          onClick={() => { setShowModal(true); closeDropdowns(); }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-sm hover:bg-muted transition-colors rounded-r-lg"
          title="Create Flashcard"
        >
          <BookOpen className="size-3.5" />
        </button>
      </div>

      {showModal && (
        <CreateCardModal
          initialFront={selectedText}
          decks={decks}
          userId={userId}
          sourcePageId={pageId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 transition-colors ${active ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
