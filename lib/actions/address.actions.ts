"use server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AddressSchema } from "@/lib/validators/address";

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Unauthorized");
  return id;
}

export async function createAddress(raw: unknown) {
  const userId = await requireUserId();
  const data = AddressSchema.parse(raw);
  if (data.isDefaultShipping) {
    await db
      .update(addresses)
      .set({ isDefaultShipping: false })
      .where(eq(addresses.userId, userId));
  }
  if (data.isDefaultBilling) {
    await db.update(addresses).set({ isDefaultBilling: false }).where(eq(addresses.userId, userId));
  }
  await db.insert(addresses).values({ ...data, userId });
  revalidatePath("/compte/adresses");
}

export async function updateAddress(raw: unknown) {
  const userId = await requireUserId();
  const data = AddressSchema.parse(raw);
  if (!data.id) throw new Error("id required for update");
  if (data.isDefaultShipping) {
    await db
      .update(addresses)
      .set({ isDefaultShipping: false })
      .where(eq(addresses.userId, userId));
  }
  if (data.isDefaultBilling) {
    await db.update(addresses).set({ isDefaultBilling: false }).where(eq(addresses.userId, userId));
  }
  await db
    .update(addresses)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(addresses.id, data.id), eq(addresses.userId, userId)));
  revalidatePath("/compte/adresses");
}

export async function deleteAddress(id: string) {
  const userId = await requireUserId();
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  revalidatePath("/compte/adresses");
}
