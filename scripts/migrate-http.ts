/**
 * Applique UNE migration Drizzle donnée via le driver HTTP de Neon (et non
 * WebSocket).
 *
 * Pourquoi : `drizzle-kit migrate` ouvre un WebSocket vers Neon, bloqué par
 * certains réseaux/proxies — la commande cale indéfiniment. Le driver HTTP
 * (fetch), utilisé par l'app en runtime, fonctionne. Le protocole étendu HTTP
 * n'accepte qu'UNE instruction par requête, donc on découpe le fichier de
 * migration sur `--> statement-breakpoint` et on exécute instruction par
 * instruction, puis on enregistre le suivi dans `drizzle.__drizzle_migrations`.
 *
 * Cible une migration précise (et non toutes) pour éviter de rejouer
 * d'anciennes migrations sur une base dont le suivi a été géré manuellement.
 * Les instructions déjà appliquées (objet existant) sont ignorées proprement,
 * donc le script est ré-exécutable sans danger.
 *
 * Usage : dotenv -e .env.local -- tsx scripts/migrate-http.ts 0015_pretty_the_fallen
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";

const DRIZZLE_DIR = "./drizzle";
const ALREADY_EXISTS = new Set(["42701", "42P07", "42710", "42P06", "42723", "42P16"]);

type JournalEntry = { idx: number; when: number; tag: string };

async function main() {
  const tag = process.argv[2];
  if (!tag) throw new Error("Tag de migration requis (ex: 0015_pretty_the_fallen)");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant");
  const sql = neon(url);

  const journal = JSON.parse(
    readFileSync(join(DRIZZLE_DIR, "meta", "_journal.json"), "utf8"),
  ) as { entries: JournalEntry[] };
  const entry = journal.entries.find((e) => e.tag === tag);
  if (!entry) throw new Error(`Migration ${tag} absente du journal`);

  // S'assurer que la table de suivi existe.
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`;

  const content = readFileSync(join(DRIZZLE_DIR, `${tag}.sql`), "utf8");
  const statements = content
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Application de ${tag} — ${statements.length} instruction(s) :`);
  let executed = 0;
  let skipped = 0;
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
    try {
      await sql.query(stmt);
      executed++;
      console.log(`  ✓ ${preview}…`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code && ALREADY_EXISTS.has(code)) {
        skipped++;
        console.log(`  • déjà présent (${code}) : ${preview}…`);
        continue;
      }
      console.error(`  ✗ échec : ${stmt}\n`, err);
      throw err;
    }
  }

  // Enregistrer le suivi (style drizzle : hash sha256 du fichier + when du journal).
  const hash = createHash("sha256").update(content).digest("hex");
  const existing = await sql`SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = ${entry.when}`;
  if (existing.length === 0) {
    await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when})`;
  }

  console.log(`\n✓ ${tag} : ${executed} appliquée(s), ${skipped} déjà présente(s). Suivi enregistré.`);
}

main().catch((err) => {
  console.error("✗ Échec :", err);
  process.exit(1);
});
