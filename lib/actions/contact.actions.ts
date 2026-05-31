"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schemas/contact";
import { getClientIp } from "@/lib/auth/rate-limit";
import { countRecentByIp } from "@/lib/queries/contact";
import { auth } from "@/lib/auth";

const REASONS = ["order", "b2b", "press", "delivery", "other"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  reason: z.enum(REASONS),
  message: z.string().trim().min(10).max(2000),
  locale: z.string().max(5),
  company: z.string().optional(), // honeypot — doit rester vide
});

// Type local : un fichier "use server" ne peut exporter que des fonctions async.
type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContactMessage(formData: FormData): Promise<ContactResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    reason: formData.get("reason"),
    message: formData.get("message"),
    locale: formData.get("locale"),
    company: formData.get("company") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  // Honeypot : un bot a rempli le champ caché → succès factice, rien stocké.
  if (parsed.data.company && parsed.data.company.trim() !== "") return { ok: true };

  const ip = getClientIp(await headers());
  if (ip && (await countRecentByIp(ip, 15)) >= 3) {
    return { ok: false, error: "rate-limit" };
  }

  await db.insert(contactMessages).values({
    name: parsed.data.name,
    email: parsed.data.email,
    reason: parsed.data.reason,
    message: parsed.data.message,
    locale: parsed.data.locale,
    sourceIp: ip ?? null,
  });
  return { ok: true };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "archived"]),
});

export async function adminUpdateMessageStatus(formData: FormData): Promise<ContactResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { ok: false, error: "forbidden" };

  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db
    .update(contactMessages)
    .set({
      status: parsed.data.status,
      readAt: parsed.data.status === "read" ? new Date() : undefined,
    })
    .where(eq(contactMessages.id, parsed.data.id));

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${parsed.data.id}`);
  return { ok: true };
}
