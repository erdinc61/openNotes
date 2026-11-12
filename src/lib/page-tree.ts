export interface PageNode {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  children: PageNode[];
  isFavorite?: boolean;
}

export function buildPageTree(
  flatPages: { id: string; title: string; icon: string | null; parentId: string | null; isFavorite?: boolean }[]
): PageNode[] {
  const map = new Map<string, PageNode>();
  for (const p of flatPages) {
    map.set(p.id, { ...p, children: [] });
  }
  const roots: PageNode[] = [];
  for (const p of flatPages) {
    const node = map.get(p.id)!;
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
