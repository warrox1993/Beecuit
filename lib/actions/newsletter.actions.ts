"use server";
import { z } from "zod";

const Schema = z.object({ email: z.string().email() });

export async function subscribeToNewsletter(raw: unknown): Promise<{ success: boolean; message: string }> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Email invalide" };
  }
  // Phase 4 will wire this to Resend audience or a custom newsletter store.
  console.log("[newsletter] subscribe stub:", parsed.data.email);
  return { success: true, message: "Merci ! On te tient au courant." };
}
