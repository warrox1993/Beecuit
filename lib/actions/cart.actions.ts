"use server";

import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { carts, cartItems, products } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { AddToCartSchema, UpdateQuantitySchema } from "@/lib/validators/cart";
import { getOrCreateCartForSessionToken, getOrCreateCartForUser } from "@/lib/queries/cart";

const COOKIE = "cart_session_token";

async function getActiveCartId(): Promise<string> {
  const session = await auth();
  if (session?.user?.id) {
    const cart = await getOrCreateCartForUser(session.user.id);
    return cart.id;
  }
  const store = await cookies();
  let token = store.get(COOKIE)?.value;
  if (!token) {
    token = uuid();
    store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  const cart = await getOrCreateCartForSessionToken(token);
  return cart.id;
}

export async function addToCart(rawInput: unknown) {
  const input = AddToCartSchema.parse(rawInput);
  const [prod] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!prod) throw new Error("Product not found");
  if (!prod.isActive) throw new Error("Product not available");

  const cartId = await getActiveCartId();

  await db
    .insert(cartItems)
    .values({ cartId, productId: input.productId, quantity: input.quantity })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: { quantity: sql`LEAST(${cartItems.quantity} + ${input.quantity}, ${prod.stockQuantity})` },
    });

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  revalidatePath("/", "layout");
}

export async function updateQuantity(rawInput: unknown) {
  const { cartItemId, quantity } = UpdateQuantitySchema.parse(rawInput);
  if (quantity === 0) {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  }
  revalidatePath("/", "layout");
}

export async function removeFromCart(cartItemId: string) {
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  revalidatePath("/", "layout");
}

export async function mergeAnonymousCart() {
  const session = await auth();
  if (!session?.user?.id) return;
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return;
  const [anon] = await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1);
  if (!anon) {
    store.delete(COOKIE);
    return;
  }
  const userCart = await getOrCreateCartForUser(session.user.id);

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, anon.id));
  for (const item of items) {
    await db
      .insert(cartItems)
      .values({ cartId: userCart.id, productId: item.productId, quantity: item.quantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + ${item.quantity}` },
      });
  }
  await db.delete(carts).where(eq(carts.id, anon.id));
  store.delete(COOKIE);
  revalidatePath("/", "layout");
}
