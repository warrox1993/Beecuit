type ProseMirrorNode = { type: string; text?: string; content?: ProseMirrorNode[] };

const WORDS_PER_MINUTE = 200;

function extractText(node: ProseMirrorNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractText).join(" ");
}

export function calculateReadingMinutes(doc: ProseMirrorNode): number {
  const text = extractText(doc);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
