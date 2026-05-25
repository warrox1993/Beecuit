/**
 * Pairing suggestions — Au Fil des Saveurs (Phase 4G).
 *
 * Maps a biscuit categorySlug to a curated trio of pairing suggestions
 * (café, thé, vin/autre boisson). Pure data — no DB. Adjust by editing
 * this file.
 */

export type Pairing = {
  emoji: string;
  label: string;
  hint: string;
};

const DEFAULT: Pairing[] = [
  { emoji: "☕", label: "Café espresso", hint: "Corsé, contraste les notes beurrées" },
  { emoji: "🍵", label: "Thé Earl Grey", hint: "Bergamote + biscuit, l'évidence" },
  { emoji: "🥂", label: "Vin de paille", hint: "Touche sucrée pour fin de repas" },
];

const BY_CATEGORY: Record<string, Pairing[]> = {
  speculoos: [
    { emoji: "☕", label: "Café noir long", hint: "Cannelle + amertume, classique belge" },
    { emoji: "🥛", label: "Lait chaud à la cardamome", hint: "Réconfortant, parfait dimanche matin" },
    { emoji: "🍻", label: "Bière brune trappiste", hint: "Notes caramélisées en miroir" },
  ],
  sables: [
    { emoji: "🍵", label: "Thé blanc", hint: "Délicat, met en valeur le beurre frais" },
    { emoji: "🍷", label: "Vin doux naturel", hint: "Muscat, banyuls — l'élégance" },
    { emoji: "🥛", label: "Chocolat chaud", hint: "Mariage gourmand par excellence" },
  ],
  macarons: [
    { emoji: "🥂", label: "Champagne brut", hint: "Bulles + ganache, fête en bouche" },
    { emoji: "☕", label: "Café crème", hint: "Texture sur texture, idéal goûter" },
    { emoji: "🍵", label: "Thé matcha", hint: "Amertume verte qui équilibre le sucre" },
  ],
};

export function getPairingsForCategory(slug: string | null | undefined): Pairing[] {
  if (!slug) return DEFAULT;
  return BY_CATEGORY[slug] ?? DEFAULT;
}
