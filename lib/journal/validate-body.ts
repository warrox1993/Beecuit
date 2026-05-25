import { ALLOWED_NODE_TYPES, ALLOWED_MARK_TYPES, type ProseMirrorNode } from "./prosemirror-types";

function walk(node: unknown): void {
  if (typeof node !== "object" || node === null) throw new Error("Invalid node");
  const n = node as { type?: string; content?: unknown; marks?: unknown; attrs?: unknown };
  if (typeof n.type !== "string" || !ALLOWED_NODE_TYPES.has(n.type)) {
    throw new Error(`Disallowed node type: ${n.type}`);
  }
  if (n.marks && Array.isArray(n.marks)) {
    for (const m of n.marks) {
      const mark = m as { type?: string };
      if (typeof mark.type !== "string" || !ALLOWED_MARK_TYPES.has(mark.type)) {
        throw new Error(`Disallowed mark: ${mark.type}`);
      }
    }
  }
  if (n.type === "video-embed") {
    const a = n.attrs as { provider?: string; videoId?: string; url?: string };
    if (a?.provider !== "youtube" && a?.provider !== "vimeo") {
      throw new Error("video-embed: bad provider");
    }
    if (!a.videoId || !a.url) throw new Error("video-embed: missing videoId or url");
  }
  if (n.type === "image" || n.type === "video-upload") {
    const a = n.attrs as { src?: string; blobPath?: string };
    if (!a?.src || !a.blobPath) throw new Error(`${n.type}: missing src/blobPath`);
  }
  if (n.type === "product-card") {
    const a = n.attrs as { productSlug?: string };
    if (!a?.productSlug || typeof a.productSlug !== "string") {
      throw new Error("product-card: missing slug");
    }
  }
  if (n.content && Array.isArray(n.content)) {
    for (const child of n.content) walk(child);
  }
}

export function validateBody(doc: unknown): asserts doc is ProseMirrorNode {
  const root = doc as { type?: string };
  if (root?.type !== "doc") throw new Error("Root must be doc");
  walk(doc);
}
