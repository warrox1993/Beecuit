export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDocument = {
  title: string;
  intro?: string;
  lastUpdatedLabel: string;
  sections: LegalSection[];
};

export type TextSegment = { text: string; placeholder: boolean };

/** Découpe un texte en segments, en isolant les `[placeholders]` (crochets conservés). */
export function renderWithPlaceholders(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  const re = /\[[^\]]+\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), placeholder: false });
    out.push({ text: m[0], placeholder: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), placeholder: false });
  return out;
}
