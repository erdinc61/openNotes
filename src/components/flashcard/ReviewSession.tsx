"use client";

import { useState } from "react";
import { submitReview, deleteCard, updateCard } from "@/actions/cards";
import { calculateSM2 } from "@/lib/sm2";
import type { InferSelectModel } from "drizzle-orm";
import type { card } from "@/db/schema";
import { MoreHorizontal } from "lucide-react";
import { ImageZoom } from "@/components/ImageZoom";
import Link from "next/link";

type Card = InferSelectModel<typeof card>;
type Rating = 0 | 1 | 2 | 3;

function formatInterval(days: number): string {
  if (days <= 0) return "now";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

interface ReviewSessionProps {
  cards: Card[];
  decks?: { id: string; name: string }[];
  reviewAll?: boolean;
}

const RATING_LABELS: { rating: Rating; label: string; className: string }[] = [
  { rating: 0, label: "Again", className: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
  { rating: 1, label: "Hard", className: "bg-orange-900/20 text-orange-400 hover:bg-orange-900/30" },
  { rating: 2, label: "Good", className: "bg-green-900/20 text-green-400 hover:bg-green-900/30" },
  { rating: 3, label: "Easy", className: "bg-blue-900/20 text-blue-400 hover:bg-blue-900/30" },
];

function DeckPicker({ decks, mode }: { decks: { id: string; name: string }[]; mode: "due" | "all" }) {
  if (decks.length === 0) return null;
  return (
    <div className="w-full max-w-lg space-y-4">
      <p className="text-lg text-muted-foreground text-center">Or pick a deck to review:</p>
      <div className="space-y-2">
        {decks.map((d) => (
          <Link
            key={d.id}
            href={`/decks/${d.id}/review?mode=${mode}`}
            className="flex items-center px-6 py-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-lg"
          >
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ReviewSession({ cards: initialCards, decks = [], reviewAll = false }: ReviewSessionProps) {
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratings, setRatings] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [showCardMenu, setShowCardMenu] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 md:gap-8 text-center px-4 md:px-6 mx-auto max-w-xl pt-16 md:pt-24">
        <div className="text-5xl md:text-7xl">🎉</div>
        <h2 className="text-2xl md:text-4xl font-semibold">No cards {reviewAll ? "available" : "due"}!</h2>
        <p className="text-lg md:text-xl text-muted-foreground">
          {reviewAll
            ? "Create some flashcards first."
            : "Come back later when more cards are due for review."}
        </p>
        {!reviewAll && (
          <Link
            href="/review?mode=all"
            className="px-6 py-3 text-lg rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            Review all cards anyway
          </Link>
        )}
        <DeckPicker decks={decks} mode="all" />
      </div>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <div className="flex flex-col items-center gap-6 md:gap-8 text-center px-4 md:px-6 mx-auto max-w-xl pt-16 md:pt-24">
        <div className="text-5xl md:text-7xl">✅</div>
        <h2 className="text-2xl md:text-4xl font-semibold">Session complete!</h2>
        <p className="text-lg md:text-xl text-muted-foreground">{reviewedCount} cards reviewed</p>
        <div className="flex flex-wrap justify-center gap-3 text-base">
          <span className="px-4 py-2 rounded-full bg-destructive/10 text-destructive">Again: {ratings[0]}</span>
          <span className="px-4 py-2 rounded-full bg-orange-900/20 text-orange-400">Hard: {ratings[1]}</span>
          <span className="px-4 py-2 rounded-full bg-green-900/20 text-green-400">Good: {ratings[2]}</span>
          <span className="px-4 py-2 rounded-full bg-blue-900/20 text-blue-400">Easy: {ratings[3]}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link
            href="/review"
            className="px-6 py-3 text-lg rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            Review due cards
          </Link>
          <Link
            href="/review?mode=all"
            className="px-6 py-3 text-lg rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            Review all cards
          </Link>
        </div>
        <DeckPicker decks={decks} mode="all" />
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = Math.round((currentIndex / cards.length) * 100);

  async function handleRate(rating: Rating) {
    await submitReview(currentCard.id, rating);
    setRatings((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    setReviewedCount((c) => c + 1);
    setShowAnswer(false);
    setIsFlipping(false);
    setCurrentIndex((i) => i + 1);
  }

  function handleShowAnswer() {
    setIsFlipping(true);
    setTimeout(() => {
      setShowAnswer(true);
      setIsFlipping(false);
    }, 150);
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null || !showAnswer) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (delta < -50) handleRate(0);
    if (delta > 50) handleRate(3);
  }

  async function handlePause() {
    setShowCardMenu(false);
    setShowAnswer(false);
    setIsFlipping(false);
    setCurrentIndex((i) => i + 1);
  }

  async function handleArchiveCard() {
    setShowCardMenu(false);
    await deleteCard(currentCard.id);
    setCards((prev) => prev.filter((c) => c.id !== currentCard.id));
    setShowAnswer(false);
    setIsFlipping(false);
  }

  async function handleSaveEdit(front: string, back: string) {
    await updateCard(currentCard.id, { front, back });
    setCards((prev) => prev.map((c) => c.id === currentCard.id ? { ...c, front, back } : c));
    setEditingCard(null);
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 md:py-12 md:px-8 space-y-6 md:space-y-8">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <p className="text-lg text-muted-foreground">
          {reviewAll ? "All cards" : "Due cards"}
        </p>
        <Link
          href={reviewAll ? "/review" : "/review?mode=all"}
          className="text-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          {reviewAll ? "Show due only" : "Review all"}
        </Link>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-lg text-muted-foreground">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Card menu */}
        <div className="absolute top-5 right-5 z-10">
          <button
            onClick={() => setShowCardMenu(!showCardMenu)}
            className="p-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="size-6" />
          </button>
          {showCardMenu && (
            <div
              className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-border bg-popover shadow-lg py-1"
              onMouseLeave={() => setShowCardMenu(false)}
            >
              <button onClick={handlePause} className="w-full text-left px-5 py-3 text-lg hover:bg-muted transition-colors">
                Pause (skip)
              </button>
              <button onClick={() => { setEditingCard(currentCard); setShowCardMenu(false); }} className="w-full text-left px-5 py-3 text-lg hover:bg-muted transition-colors">
                Edit
              </button>
              <button onClick={handleArchiveCard} className="w-full text-left px-5 py-3 text-lg hover:bg-muted text-destructive transition-colors">
                Archive
              </button>
            </div>
          )}
        </div>

        {/* Card face */}
        <div
          className="min-h-[240px] md:min-h-[340px] rounded-2xl border border-border bg-card p-6 md:p-12 flex items-center justify-center cursor-pointer select-none transition-opacity duration-150"
          style={{ opacity: isFlipping ? 0 : 1 }}
          onClick={!showAnswer ? handleShowAnswer : undefined}
        >
          <div className="text-center space-y-5 w-full">
            {!showAnswer ? (
              <div>
                {currentCard.frontImage && (
                  <ImageZoom src={currentCard.frontImage} className="max-h-64 mx-auto mb-8 rounded-xl object-contain" />
                )}
                <p className="text-xl md:text-3xl font-medium">{currentCard.front}</p>
                <p className="text-base md:text-lg text-muted-foreground mt-6 md:mt-8">Tap to reveal answer</p>
              </div>
            ) : (
              <div>
                {currentCard.backImage && (
                  <ImageZoom src={currentCard.backImage} className="max-h-64 mx-auto mb-8 rounded-xl object-contain" />
                )}
                <p className="text-xl md:text-3xl font-medium">{currentCard.back}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!showAnswer ? (
        <button
          onClick={handleShowAnswer}
          className="w-full min-h-[64px] rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-lg transition-colors"
        >
          Show Answer
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {RATING_LABELS.map(({ rating, label, className }) => {
            const preview = calculateSM2(
              { interval: currentCard.interval, easeFactor: currentCard.easeFactor, repetitions: currentCard.repetitions },
              rating
            );
            return (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                className={`min-h-[64px] rounded-xl font-medium text-lg transition-colors flex flex-col items-center justify-center gap-0.5 ${className}`}
              >
                <span>{label}</span>
                <span className="text-sm opacity-70">{formatInterval(preview.interval)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Swipe hint */}
      {showAnswer && (
        <p className="text-sm text-center text-muted-foreground">
          Swipe left = Again · Swipe right = Easy
        </p>
      )}

      {/* Edit modal */}
      {editingCard && (
        <EditCardModal
          card={editingCard}
          onSave={handleSaveEdit}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}

function EditCardModal({
  card,
  onSave,
  onClose,
}: {
  card: Card;
  onSave: (front: string, back: string) => void;
  onClose: () => void;
}) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background border border-border rounded-2xl p-8 w-full max-w-lg space-y-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold">Edit card</h3>
        <div className="space-y-1.5">
          <label className="text-lg font-medium">Front</label>
          <textarea
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-lg font-medium">Back</label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-lg rounded-xl border border-border hover:bg-muted transition-colors">Cancel</button>
          <button onClick={() => onSave(front, back)} className="px-5 py-2.5 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}
