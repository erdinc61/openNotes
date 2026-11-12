"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { updatePage } from "@/actions/pages";
import { uploadImage } from "@/actions/uploads";
import { SelectionToolbar } from "./SelectionToolbar";
import { SlashCommand } from "./SlashCommandMenu";
import { ImageIcon, Undo2, Redo2 } from "lucide-react";

interface PageEditorProps {
  pageId: string;
  initialContent: string;
  initialTitle: string;
  decks?: { id: string; name: string }[];
  userId?: string;
}

export function PageEditor({ pageId, initialContent, initialTitle, decks = [], userId = "" }: PageEditorProps) {
  const router = useRouter();
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: 'Type "/" for commands...',
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-400 underline cursor-pointer" },
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      SlashCommand,
    ],
    content: initialContent ? JSON.parse(initialContent) : "",
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[60vh] text-xl leading-relaxed",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;

            const formData = new FormData();
            formData.append("file", file);

            uploadImage(formData).then(({ url }) => {
              const { state } = view;
              const pos = state.selection.anchor;
              const node = state.schema.nodes.image.create({ src: url });
              const tr = state.tr.insert(pos, node);
              view.dispatch(tr);
            });

            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!zoomSrc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomSrc(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomSrc]);

  const saveContent = useCallback(async () => {
    if (!editor) return;
    const content = JSON.stringify(editor.getJSON());
    await updatePage(pageId, { content });
  }, [editor, pageId]);

  useEffect(() => {
    if (!editor) return;
    editor.on("blur", saveContent);
    return () => {
      editor.off("blur", saveContent);
      void saveContent();
    };
  }, [editor, saveContent]);

  function handleTitleInput(e: React.FormEvent<HTMLHeadingElement>) {
    const title = e.currentTarget.textContent ?? "Untitled";
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(async () => {
      await updatePage(pageId, { title });
    }, 400);
  }

  async function handleTitleBlur(e: React.FocusEvent<HTMLHeadingElement>) {
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }
    const title = e.currentTarget.textContent ?? "Untitled";
    await updatePage(pageId, { title });
    router.refresh();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { url } = await uploadImage(formData);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      // silently fail
    }

    e.target.value = "";
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLHeadingElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      editor?.commands.focus("start");
    }
  }

  return (
    <div className="max-w-[900px] mx-auto pb-8 px-4 md:pb-16 md:px-8">
      <h1
        contentEditable
        suppressContentEditableWarning
        onInput={handleTitleInput}
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
        className="text-3xl md:text-5xl font-bold leading-tight mb-2 focus:outline-none empty:before:content-['Untitled'] empty:before:text-muted-foreground/50 text-foreground"
      >
        {initialTitle}
      </h1>

      {/* Subtle action bar */}
      <div className="flex items-center gap-1 mb-6 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        <label
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          <ImageIcon className="size-4" />
          <span>Add image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
        <button
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="size-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="size-4" />
        </button>
      </div>

      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") {
            const src = (target as HTMLImageElement).src;
            if (src) setZoomSrc(src);
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {zoomSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setZoomSrc(null)}
        >
          <img
            src={zoomSrc}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {userId && (
        <SelectionToolbar
          editor={editor}
          decks={decks}
          userId={userId}
          pageId={pageId}
        />
      )}
    </div>
  );
}
