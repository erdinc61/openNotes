"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Layers } from "lucide-react";
import { createDeck, renameDeck, deleteDeck } from "@/actions/decks";

interface DeckItem {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  dueCount: number;
  nextDue: Date | null;
}

function formatNextDue(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Cards due now";
  if (days === 1) return "Next card tomorrow";
  if (days < 7) return `Next card in ${days} days`;
  if (days < 30) return `Next card in ${Math.ceil(days / 7)} weeks`;
  return `Next card ${date.toLocaleDateString()}`;
}

interface DeckListProps {
  decks: DeckItem[];
  userId: string;
}

export function DeckList({ decks: initialDecks, userId }: DeckListProps) {
  const router = useRouter();
  const [decks, setDecks] = useState(initialDecks);
  const [creating, setCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const deck = await createDeck(userId, newDeckName.trim());
    setDecks((prev) => [...prev, { id: deck.id, name: deck.name, description: deck.description, cardCount: 0, dueCount: 0, nextDue: null }]);
    setNewDeckName("");
    setCreating(false);
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    await renameDeck(id, renameValue.trim());
    setDecks((prev) => prev.map((d) => d.id === id ? { ...d, name: renameValue.trim() } : d));
    setRenamingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this deck and all its cards?")) return;
    await deleteDeck(id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl md:text-5xl font-bold">Decks</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 md:gap-2.5 md:px-5 md:py-3 text-base md:text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-5 md:size-6" />
          New Deck
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            autoFocus
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="Deck name"
            className="flex-1 px-5 py-3 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="px-5 py-3 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Create
          </button>
          <button type="button" onClick={() => setCreating(false)} className="px-5 py-3 text-lg rounded-xl border border-border hover:bg-muted transition-colors">
            Cancel
          </button>
        </form>
      )}

      {decks.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Layers className="size-14 mx-auto mb-5 opacity-30" />
          <p className="text-xl">No decks yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <div key={deck.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors group">
              {renamingId === deck.id ? (
                <form onSubmit={(e) => { e.preventDefault(); handleRename(deck.id); }} className="flex-1 flex gap-3">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-lg border border-input rounded-xl bg-background focus:outline-none"
                  />
                  <button type="submit" className="px-5 py-2.5 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
                  <button type="button" onClick={() => setRenamingId(null)} className="px-5 py-2.5 text-lg rounded-xl border border-border hover:bg-muted transition-colors">Cancel</button>
                </form>
              ) : (
                <>
                  <Link href={`/decks/${deck.id}`} className="flex-1 min-w-0">
                    <p className="text-lg md:text-xl font-medium truncate">{deck.name}</p>
                    <p className="text-base md:text-lg text-muted-foreground">{deck.cardCount} cards · {deck.dueCount} due</p>
                    {deck.nextDue && deck.dueCount === 0 && (
                      <p className="text-sm text-muted-foreground/60 mt-0.5">{formatNextDue(deck.nextDue)}</p>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {deck.dueCount > 0 && (
                      <Link
                        href={`/decks/${deck.id}/review`}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 text-base sm:text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                      >
                        Review {deck.dueCount}
                      </Link>
                    )}
                    <Link
                      href={`/decks/${deck.id}/review?mode=all`}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 text-base sm:text-lg rounded-xl bg-muted hover:bg-muted/80 transition-colors text-foreground"
                    >
                      Review All
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === deck.id ? null : deck.id)}
                        className="p-2 sm:p-2.5 rounded-xl sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted transition-all"
                      >
                        <MoreHorizontal className="size-5 sm:size-6" />
                      </button>
                      {menuOpen === deck.id && (
                        <div
                          className="absolute right-0 top-10 sm:top-12 z-50 w-48 rounded-xl border border-border bg-popover shadow-lg py-1"
                          onMouseLeave={() => setMenuOpen(null)}
                        >
                          <button
                            onClick={() => { setRenamingId(deck.id); setRenameValue(deck.name); setMenuOpen(null); }}
                            className="w-full text-left px-5 py-3 text-lg hover:bg-muted transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => { handleDelete(deck.id); setMenuOpen(null); }}
                            className="w-full text-left px-5 py-3 text-lg hover:bg-muted text-destructive transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
