"use client";

import { Download } from "lucide-react";
import { exportPageAsMarkdown } from "@/actions/export";

export function ExportButton({ pageId }: { pageId: string }) {
  async function handleExport() {
    const { title, markdown } = await exportPageAsMarkdown(pageId);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "Untitled"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-muted-foreground hover:bg-muted rounded-lg cursor-pointer transition-colors"
      title="Export as Markdown"
    >
      <Download className="size-3.5" />
      Export
    </button>
  );
}
