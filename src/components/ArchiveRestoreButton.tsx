"use client";

import { useRouter } from "next/navigation";
import { restorePage } from "@/actions/pages";

export function ArchiveRestoreButton({ pageId }: { pageId: string }) {
  const router = useRouter();

  async function handleRestore() {
    await restorePage(pageId);
    router.refresh();
  }

  return (
    <button
      onClick={handleRestore}
      className="px-3 py-1.5 text-sm rounded-lg border border-input hover:bg-muted transition-colors shrink-0"
    >
      Restore
    </button>
  );
}
