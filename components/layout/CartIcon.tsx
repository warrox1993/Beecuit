import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carts, cartItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function getCartItemCount(): Promise<number> {
  const session = await auth();
  let cartId: string | null = null;
  if (session?.user?.id) {
    const [c] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, session.user.id))
      .limit(1);
    cartId = c?.id ?? null;
  } else {
    const store = await cookies();
    const token = store.get("cart_session_token")?.value;
    if (token) {
      const [c] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.sessionToken, token))
        .limit(1);
      cartId = c?.id ?? null;
    }
  }
  if (!cartId) return 0;
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return row?.total ?? 0;
}

export async function CartIcon() {
  const count = await getCartItemCount();
  return (
    <Link
      href="/panier"
      aria-label="Panier"
      id="cart-icon-anchor"
      className="text-warm-brown hover:text-honey-dark relative inline-block transition-transform"
    >
      <span>🛒</span>
      {count > 0 && (
        <span className="bg-honey text-cream absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
