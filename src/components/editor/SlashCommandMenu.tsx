"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { type Editor, Extension } from "@tiptap/react";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { type SuggestionOptions, type SuggestionProps } from "@tiptap/suggestion";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  CodeSquare,
  Minus,
  Table,
  ImageIcon,
} from "lucide-react";
import ReactDOM from "react-dom/client";

interface CommandItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor) => void;
}

const COMMANDS: CommandItem[] = [
  { label: "Text", icon: Type, action: (e) => e.chain().focus().setParagraph().run() },
  { label: "Heading 1", icon: Heading1, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: "Heading 2", icon: Heading2, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: "Heading 3", icon: Heading3, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: "Bullet List", icon: List, action: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "Numbered List", icon: ListOrdered, action: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "To-do List", icon: CheckSquare, action: (e) => e.chain().focus().toggleTaskList().run() },
  { label: "Quote", icon: Quote, action: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: "Code Block", icon: CodeSquare, action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Divider", icon: Minus, action: (e) => e.chain().focus().setHorizontalRule().run() },
  {
    label: "Table",
    icon: Table,
    action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
];

function SlashCommandList({
  items,
  command,
}: {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (items[selectedIndex]) command(items[selectedIndex]);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [items, selectedIndex, command]);

  useLayoutEffect(() => {
    const el = menuRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <div className="w-56 p-2 rounded-xl border border-border bg-popover shadow-lg text-sm text-muted-foreground">
        No results
      </div>
    );
  }

  return (
    <div ref={menuRef} className="w-56 max-h-80 overflow-y-auto py-1 rounded-xl border border-border bg-popover shadow-lg">
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={() => command(item)}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors text-left ${
            i === selectedIndex ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

export const slashCommandPluginKey = new PluginKey("slashCommand");

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: slashCommandPluginKey,
        command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: CommandItem }) => {
          editor.chain().focus().deleteRange(range).run();
          props.action(editor);
        },
        items: ({ query }: { query: string }): CommandItem[] => {
          return COMMANDS.filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase())
          );
        },
        render: () => {
          let container: HTMLDivElement | null = null;
          let root: ReactDOM.Root | null = null;
          let popup: HTMLDivElement | null = null;

          return {
            onStart(props: SuggestionProps) {
              popup = document.createElement("div");
              popup.style.position = "absolute";
              popup.style.zIndex = "50";
              document.body.appendChild(popup);

              root = ReactDOM.createRoot(popup);
              root.render(
                <SlashCommandList
                  items={props.items as CommandItem[]}
                  command={(item) => props.command(item)}
                />
              );

              const rect = props.clientRect?.();
              if (rect && popup) {
                popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }
            },
            onUpdate(props: SuggestionProps) {
              if (root) {
                root.render(
                  <SlashCommandList
                    items={props.items as CommandItem[]}
                    command={(item) => props.command(item)}
                  />
                );
              }
              const rect = props.clientRect?.();
              if (rect && popup) {
                popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              }
            },
            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === "Escape") {
                popup?.remove();
                root?.unmount();
                return true;
              }
              if (["ArrowDown", "ArrowUp", "Enter"].includes(props.event.key)) {
                return true;
              }
              return false;
            },
            onExit() {
              root?.unmount();
              popup?.remove();
            },
          };
        },
      } satisfies Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
