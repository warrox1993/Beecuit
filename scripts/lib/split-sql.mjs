// Découpage d'un fichier de migration drizzle en instructions SQL exécutables.
// Module séparé de apply-pending-migrations.mjs pour pouvoir le tester sans base.

const BREAKPOINT = /-->\s*statement-breakpoint/g;

/**
 * Vrai si le bloc ne contient que des lignes vides ou des commentaires `--`.
 * Test ligne à ligne, en temps linéaire : l'ancienne expression
 * `/^(--[^\n]*|\s)+$/m` avait un retour arrière exponentiel (alerte CodeQL
 * js/redos) et, à cause du drapeau `m`, écartait aussi toute instruction
 * précédée d'une ligne de commentaire (ex. 0004_coffrets.sql, 0005_gift_cards.sql).
 */
export function isCommentOrBlank(block) {
  return block.split("\n").every((line) => {
    const trimmed = line.trim();
    return trimmed === "" || trimmed.startsWith("--");
  });
}

/** Instructions SQL d'un fichier de migration, sans marqueurs ni blocs de commentaires seuls. */
export function splitSqlStatements(content) {
  return content
    .replace(BREAKPOINT, "")
    .split(/;\s*(?=\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !isCommentOrBlank(s));
}
