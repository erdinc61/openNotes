"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface MobileBackHeaderProps {
  title?: string;
  fallbackHref?: string;
}

export function MobileBackHeader({ title, fallbackHref = "/" }: MobileBackHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 h-12 px-2 bg-background/80 backdrop-blur-lg border-b border-border md:hidden">
      <button
        onClick={handleBack}
        className="flex items-center gap-0.5 px-2 py-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-5" />
        <span className="text-sm">Back</span>
      </button>
      {title && (
        <span className="text-sm font-medium truncate flex-1 text-center pr-16">{title}</span>
      )}
    </div>
  );
}
