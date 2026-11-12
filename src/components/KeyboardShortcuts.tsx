"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const SHORTCUTS = [
  {
    group: "Navigation",
    items: [
      { keys: ["Ctrl", "K"], desc: "Search" },
      { keys: ["?"], desc: "Keyboard shortcuts" },
    ],
  },
  {
    group: "Text Formatting",
    items: [
      { keys: ["Ctrl", "B"], desc: "Bold" },
      { keys: ["Ctrl", "I"], desc: "Italic" },
      { keys: ["Ctrl", "U"], desc: "Underline" },
      { keys: ["Ctrl", "Shift", "S"], desc: "Strikethrough" },
      { keys: ["Ctrl", "E"], desc: "Inline code" },
      { keys: ["Ctrl", "Shift", "H"], desc: "Highlight" },
    ],
  },
  {
    group: "Blocks",
    items: [
      { keys: ["/"], desc: "Slash commands" },
      { keys: ["Ctrl", "Shift", "1"], desc: "Heading 1" },
      { keys: ["Ctrl", "Shift", "2"], desc: "Heading 2" },
      { keys: ["Ctrl", "Shift", "3"], desc: "Heading 3" },
      { keys: ["Ctrl", "Shift", "8"], desc: "Bullet list" },
      { keys: ["Ctrl", "Shift", "9"], desc: "Ordered list" },
    ],
  },
  {
    group: "Editor",
    items: [
      { keys: ["Ctrl", "Z"], desc: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], desc: "Redo" },
      { keys: ["Ctrl", "V"], desc: "Paste (images supported)" },
    ],
  },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-popover border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-popover">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{group.group}</h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1">
                    <span className="text-sm">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="px-2 py-0.5 text-xs rounded-md bg-muted border border-border font-mono">{key}</kbd>
                          {i < item.keys.length - 1 && <span className="text-muted-foreground mx-0.5">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
