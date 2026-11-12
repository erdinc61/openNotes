"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { createPage } from "@/actions/pages";

export function NewPageButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const newPage = await createPage(userId);
    router.refresh();
    router.push(`/pages/${newPage.id}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2.5 px-5 py-2.5 text-lg rounded-xl hover:bg-muted transition-colors duration-100 text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      <Plus className="size-6" />
      New Page
    </button>
  );
}
