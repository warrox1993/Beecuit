type ProseMirrorNode = { type: string; text?: string; content?: ProseMirrorNode[] };

function nodeToText(node: ProseMirrorNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(nodeToText).join("");
}

export function generateExcerpt(doc: ProseMirrorNode, maxChars: number): string {
  const firstParagraph = doc.content?.find((n) => n.type === "paragraph");
  if (!firstParagraph) return "";
  const text = nodeToText(firstParagraph).trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1).trimEnd() + "…";
}
