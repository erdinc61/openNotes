"use client";

import { useState, useRef, useEffect } from "react";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Pages", emojis: ["📄", "📝", "📋", "📒", "📓", "📔", "📕", "📗", "📘", "📙", "🗒️", "🗂️", "📑", "🔖", "📎"] },
  { label: "Objects", emojis: ["💡", "🔑", "🔒", "🔧", "⚙️", "🛠️", "💻", "📱", "🖥️", "⌨️", "🎯", "📌", "✏️", "🖊️", "📐"] },
  { label: "Nature", emojis: ["🌱", "🌿", "🍀", "🌸", "🌻", "🌲", "🌍", "⭐", "🌙", "☀️", "🔥", "💧", "❄️", "🌈", "⚡"] },
  { label: "Food", emojis: ["🍎", "🍋", "🍇", "🥑", "🍕", "🍜", "☕", "🍵", "🧁", "🍪", "🥗", "🍔", "🌮", "🍣", "🥐"] },
  { label: "Activity", emojis: ["🏃", "🧘", "💪", "🎮", "🎵", "🎨", "📸", "✈️", "🚀", "🏠", "🎓", "🏆", "🎪", "🎲", "♟️"] },
  { label: "Symbols", emojis: ["✅", "❌", "⚠️", "💬", "💭", "❤️", "🧠", "👁️", "🤝", "👍", "🎉", "💎", "🏷️", "📊", "🧪"] },
];

interface EmojiPickerProps {
  currentEmoji: string | null;
  onSelect: (emoji: string | null) => void;
  onClose: () => void;
}

export function EmojiPicker({ currentEmoji, onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  const allEmojis = EMOJI_GROUPS.flatMap((g) => g.emojis);
  const filtered = search
    ? allEmojis.filter(() => true) // emojis don't have text names here, just show all
    : null;

  return (
    <div ref={ref} className="w-72 p-3 rounded-xl border border-border bg-popover shadow-lg z-50">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search emoji..."
        className="w-full px-3 py-1.5 text-sm bg-muted rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-ring mb-2"
        autoFocus
      />

      {currentEmoji && (
        <button
          onClick={() => onSelect(null)}
          className="w-full text-left px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg mb-2 transition-colors"
        >
          Remove icon
        </button>
      )}

      <div className="max-h-52 overflow-y-auto space-y-2">
        {filtered ? (
          <div className="flex flex-wrap gap-1">
            {allEmojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => onSelect(emoji)}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs text-muted-foreground font-medium px-1 mb-1">{group.label}</p>
              <div className="flex flex-wrap gap-1">
                {group.emojis.map((emoji, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(emoji)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
