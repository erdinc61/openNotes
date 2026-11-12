"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { deleteCard } from "@/actions/cards";
import { CreateCardModal } from "./CreateCardModal";
import type { InferSelectModel } from "drizzle-orm";
import type { card } from "@/db/schema";

type Card = InferSelectModel<typeof card>;

function formatDueDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "now";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 30) return `in ${Math.ceil(days / 7)} weeks`;
  return date.toLocaleDateString();
}

interface DeckDetailProps {
  deck: { id: string; name: string };
  cards: Card[];
  decks: { id: string; name: string }[];
  userId: string;
  dueCount?: number;
}

export function DeckDetail({ deck, cards: initialCards, decks, userId, dueCount = 0 }: DeckDetailProps) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [showCreate, setShowCreate] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  async function handleDelete(cardId: string) {
    if (!confirm("Archive this card?")) return;
    await deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/decks" className="p-2 md:p-2.5 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="size-5 md:size-6" />
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold flex-1 truncate">{deck.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {dueCount > 0 && (
            <Link
              href={`/decks/${deck.id}/review`}
              className="px-4 py-2 md:px-5 md:py-3 text-base md:text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Review {dueCount}
            </Link>
          )}
          <Link
            href={`/decks/${deck.id}/review?mode=all`}
            className="px-4 py-2 md:px-5 md:py-3 text-base md:text-lg rounded-xl bg-muted hover:bg-muted/80 transition-colors text-foreground"
          >
            Review All
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 md:gap-2.5 md:px-5 md:py-3 text-base md:text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-5 md:size-6" />
            Add Card
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-xl">No cards in this deck yet.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 px-5 py-3 text-lg rounded-xl border border-border hover:bg-muted transition-colors"
          >
            Create your first card
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 md:gap-5 px-4 py-4 md:px-6 md:py-5 rounded-2xl border border-border bg-card group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-base md:text-lg font-medium truncate">{c.front}</p>
                <p className="text-base md:text-lg text-muted-foreground truncate">{c.back}</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {new Date(c.dueDate) <= new Date()
                    ? "Due now"
                    : `Due ${formatDueDate(c.dueDate)}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => setEditingCard(c)}
                  className="p-2.5 rounded-xl hover:bg-muted transition-colors"
                  title="Edit"
                >
                  <Pencil className="size-5" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2.5 rounded-xl hover:bg-muted transition-colors text-destructive"
                  title="Archive"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editingCard) && (
        <CreateCardModal
          decks={[decks.find((d) => d.id === deck.id)!, ...decks.filter((d) => d.id !== deck.id)]}
          userId={userId}
          editingCard={editingCard ?? undefined}
          onClose={() => { setShowCreate(false); setEditingCard(null); }}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
