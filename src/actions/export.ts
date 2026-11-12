"use server";

import { db } from "@/db";
import { page } from "@/db/schema";
import { eq } from "drizzle-orm";

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
}

function marksToMd(text: string, marks?: TiptapNode["marks"]): string {
  if (!marks || marks.length === 0) return text;
  let result = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold": result = `**${result}**`; break;
      case "italic": result = `*${result}*`; break;
      case "strike": result = `~~${result}~~`; break;
      case "code": result = `\`${result}\``; break;
      case "underline": result = `<u>${result}</u>`; break;
      case "link": result = `[${result}](${mark.attrs?.href ?? ""})`; break;
    }
  }
  return result;
}

function inlineToMd(nodes?: TiptapNode[]): string {
  if (!nodes) return "";
  return nodes.map((n) => {
    if (n.type === "text") return marksToMd(n.text ?? "", n.marks);
    if (n.type === "hardBreak") return "\n";
    return "";
  }).join("");
}

function nodeToMd(node: TiptapNode, depth = 0): string {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((n) => nodeToMd(n, depth)).join("\n\n");
    case "paragraph":
      return inlineToMd(node.content);
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return "#".repeat(level) + " " + inlineToMd(node.content);
    }
    case "bulletList":
      return (node.content ?? []).map((n) => nodeToMd(n, depth)).join("\n");
    case "orderedList":
      return (node.content ?? []).map((n, i) => {
        const text = inlineToMd(n.content?.[0]?.content);
        return `${"  ".repeat(depth)}${i + 1}. ${text}`;
      }).join("\n");
    case "listItem":
      return `${"  ".repeat(depth)}- ${inlineToMd(node.content?.[0]?.content)}`;
    case "taskList":
      return (node.content ?? []).map((n) => nodeToMd(n, depth)).join("\n");
    case "taskItem": {
      const checked = node.attrs?.checked ? "x" : " ";
      return `${"  ".repeat(depth)}- [${checked}] ${inlineToMd(node.content?.[0]?.content)}`;
    }
    case "blockquote":
      return (node.content ?? []).map((n) => "> " + nodeToMd(n, depth)).join("\n");
    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      const code = inlineToMd(node.content);
      return "```" + lang + "\n" + code + "\n```";
    }
    case "horizontalRule":
      return "---";
    case "image":
      return `![](${node.attrs?.src ?? ""})`;
    case "table":
      return tableToMd(node);
    default:
      return inlineToMd(node.content);
  }
}

function tableToMd(node: TiptapNode): string {
  const rows = node.content ?? [];
  if (rows.length === 0) return "";
  const lines: string[] = [];
  rows.forEach((row, ri) => {
    const cells = (row.content ?? []).map((cell) => inlineToMd(cell.content?.[0]?.content));
    lines.push("| " + cells.join(" | ") + " |");
    if (ri === 0) {
      lines.push("| " + cells.map(() => "---").join(" | ") + " |");
    }
  });
  return lines.join("\n");
}

export async function exportPageAsMarkdown(pageId: string): Promise<{ title: string; markdown: string }> {
  const p = await db.query.page.findFirst({ where: eq(page.id, pageId) });
  if (!p) throw new Error("Page not found");

  let markdown = `# ${p.title}\n\n`;
  if (p.content) {
    try {
      const json = JSON.parse(p.content) as TiptapNode;
      markdown += nodeToMd(json);
    } catch {
      markdown += p.content;
    }
  }

  return { title: p.title, markdown };
}
