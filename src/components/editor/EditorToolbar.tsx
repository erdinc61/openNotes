"use client";

import { type Editor } from "@tiptap/react";
import { ImageIcon } from "lucide-react";
import { useRef } from "react";
import { uploadImage } from "@/actions/uploads";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { url } = await uploadImage(formData);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/30">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Insert image"
        className="p-1.5 rounded hover:bg-muted transition-colors"
      >
        <ImageIcon className="size-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
