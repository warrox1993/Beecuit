"use server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/client";
import { NewsletterConfirmationEmail } from "@/components/email/NewsletterConfirmationEmail";

export const subscribeInputSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "nl", "en", "de"]),
  journalOptIn: z.boolean().default(false),
  source: z.enum(["home", "journal_inline", "checkout"]).optional(),
});

export async function subscribeToNewsletter(
  raw: unknown,
): Promise<{ success: boolean; message: string }> {
  const parsed = subscribeInputSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: "Email invalide" };
  const { email, locale, journalOptIn, source } = parsed.data;

  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  let confirmToken: string;
  if (existing[0]) {
    if (existing[0].status === "confirmed") {
      // Idempotent: update journal_opt_in if user re-subscribes with opt-in
      if (journalOptIn && !existing[0].journalOptIn) {
        await db
          .update(newsletterSubscribers)
          .set({ journalOptIn: true })
          .where(eq(newsletterSubscribers.id, existing[0].id));
      }
      return { success: true, message: "Vous êtes déjà inscrit·e. Merci !" };
    }
    // pending or unsubscribed → resend confirmation, refresh token + locale + opt-in
    confirmToken = randomUUID();
    await db
      .update(newsletterSubscribers)
      .set({
        confirmToken,
        locale,
        journalOptIn,
        status: "pending",
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, existing[0].id));
  } else {
    confirmToken = randomUUID();
    await db.insert(newsletterSubscribers).values({
      email,
      locale,
      journalOptIn,
      confirmToken,
      unsubscribeToken: randomUUID(),
      source: source ?? null,
    });
  }

  const confirmUrl = `${env.NEXT_PUBLIC_APP_URL}/api/newsletter/confirm/${confirmToken}`;
  await sendEmail({
    to: email,
    subject: "Confirmez votre inscription — Au Fil des Saveurs",
    react: NewsletterConfirmationEmail({ confirmUrl, journalOptIn }),
  });

  return { success: true, message: "Vérifiez votre boîte mail pour confirmer." };
}
