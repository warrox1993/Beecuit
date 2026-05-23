"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const Rate = z.object({
  id: z.string().optional(),
  method: z.string().min(1),
  country: z.string().length(2).default("BE"),
  weightGramsMax: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  freeShippingThresholdCents: z.number().int().nonnegative().nullable(),
  sortOrder: z.number().int().default(0),
});

export async function createRate(raw: unknown) {
  await requireAdmin();
  const d = Rate.parse(raw);
  await db.insert(shippingRates).values(d);
  revalidatePath("/admin/livraison");
}

export async function updateRate(raw: unknown) {
  await requireAdmin();
  const d = Rate.parse(raw);
  if (!d.id) throw new Error("id required");
  await db.update(shippingRates).set(d).where(eq(shippingRates.id, d.id));
  revalidatePath("/admin/livraison");
}

export async function deleteRate(id: string) {
  await requireAdmin();
  await db.delete(shippingRates).where(eq(shippingRates.id, id));
  revalidatePath("/admin/livraison");
}
