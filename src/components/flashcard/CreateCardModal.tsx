"use client";

import { useState } from "react";
import { createCard, updateCard } from "@/actions/cards";
import { uploadImage } from "@/actions/uploads";
import { ImageIcon, X } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { card } from "@/db/schema";

type Card = InferSelectModel<typeof card>;

interface CreateCardModalProps {
  initialFront?: string;
  decks: { id: string; name: string }[];
  userId: string;
  sourcePageId?: string;
  editingCard?: Card;
  onClose: () => void;
  onSaved?: () => void;
}

export function CreateCardModal({
  initialFront = "",
  decks,
  userId,
  sourcePageId,
  editingCard,
  onClose,
  onSaved,
}: CreateCardModalProps) {
  const isEditing = !!editingCard;
  const [front, setFront] = useState(editingCard?.front ?? initialFront);
  const [back, setBack] = useState(editingCard?.back ?? "");
  const [deckId, setDeckId] = useState(editingCard?.deckId ?? decks[0]?.id ?? "");
  const [frontImage, setFrontImage] = useState<string | null>(editingCard?.frontImage ?? null);
  const [backImage, setBackImage] = useState<string | null>(editingCard?.backImage ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleImageUpload(side: "front" | "back", file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { url } = await uploadImage(formData);
      if (side === "front") setFrontImage(url);
      else setBackImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleSave() {
    if (!front.trim() || !back.trim()) {
      setError("Front and back are required");
      return;
    }
    if (!deckId) {
      setError("Please select a deck");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEditing) {
        await updateCard(editingCard.id, {
          front: front.trim(),
          back: back.trim(),
          frontImage: frontImage ?? undefined,
          backImage: backImage ?? undefined,
        });
      } else {
        await createCard({
          deckId,
          userId,
          front: front.trim(),
          back: back.trim(),
          frontImage: frontImage ?? undefined,
          backImage: backImage ?? undefined,
          sourcePageId,
        });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-2xl w-full max-w-lg space-y-5 p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{isEditing ? "Edit card" : "Create flashcard"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        {!isEditing && decks.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-lg font-medium">Deck</label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        <CardSideInput
          label="Front"
          value={front}
          onChange={setFront}
          image={frontImage}
          onImageUpload={(file) => handleImageUpload("front", file)}
          onImageRemove={() => setFrontImage(null)}
        />
        <CardSideInput
          label="Back"
          value={back}
          onChange={setBack}
          image={backImage}
          onImageUpload={(file) => handleImageUpload("back", file)}
          onImageRemove={() => setBackImage(null)}
        />

        {error && <p className="text-base text-destructive">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 text-lg rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : isEditing ? "Save" : "Create card"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CardSideInput({
  label,
  value,
  onChange,
  image,
  onImageUpload,
  onImageRemove,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  image: string | null;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
}) {
  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) onImageUpload(file);
        return;
      }
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-lg font-medium">{label}</label>
        <label className="cursor-pointer p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ImageIcon className="size-5 text-muted-foreground" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageUpload(f); }}
          />
        </label>
      </div>
      {image && (
        <div className="relative">
          <img src={image} alt="" className="w-full max-h-40 object-contain rounded-xl border border-border" />
          <button
            onClick={onImageRemove}
            className="absolute top-2 right-2 p-1 rounded-lg bg-background border border-border"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        rows={3}
        className="w-full px-4 py-3 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        placeholder={`${label} of card... (Ctrl+V to paste image)`}
      />
    </div>
  );
}
