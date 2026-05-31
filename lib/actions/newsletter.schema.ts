import { z } from "zod";

/**
 * Schéma d'inscription newsletter, isolé dans un fichier sans `"use server"` :
 * un fichier server-action ne peut exporter que des fonctions async (Next 15).
 */
export const subscribeInputSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "nl", "en", "de"]),
  journalOptIn: z.boolean().default(false),
  source: z.enum(["home", "journal_inline", "checkout"]).optional(),
});
