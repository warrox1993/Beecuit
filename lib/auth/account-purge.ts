import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  passwordResetTokens,
  addresses,
  carts,
  cartItems,
  newsletterSubscribers,
  orders,
  subscriptions,
  giftCards,
} from "@/lib/db/schema";

const SENTINEL_EMAIL = (userId: string) => `deleted-${userId}@anon.invalid`;

/**
 * Anonymize a user and delete their non-essential PII rows.
 *
 * Keeps rows the law requires (orders, subscriptions, gift_cards for 7y BE
 * accounting) but scrubs personally identifying fields in those rows.
 *
 * Idempotent: a second call on a row already carrying purged_at is a no-op.
 *
 * Schema notes:
 * - orders: no direct `email` column; PII lives in guestEmail (guest orders,
 *   not linked to userId) and the two jsonb address snapshots. We strip PII
 *   keys from the jsonb snapshots for userId-linked rows.
 * - subscriptions: userId FK (cascade), shippingAddressSnapshot jsonb.
 * - b2b_quote_requests: no userId FK for the customer (only quotedBy=admin).
 *   Cannot be correlated to the purged user, so no action taken.
 * - gift_cards: purchaserUserId FK (set null), purchaserEmail text.
 * - addresses, carts, cartItems: CASCADE deletes fire when the user row is
 *   updated, but we delete them explicitly before the user update to be safe
 *   (cascades only fire on DELETE of the parent, not UPDATE).
 */
export async function purgeUser(userId: string): Promise<void> {
  // Check idempotency: skip if already purged.
  const [existing] = await db
    .select({ id: users.id, email: users.email, purgedAt: users.purgedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing || existing.purgedAt) return;

  const sentinel = SENTINEL_EMAIL(userId);

  await db.transaction(async (tx) => {
    // ── DELETE rows that are pure personal data ──

    // cartItems cascade from carts, but delete explicitly to be explicit
    await tx
      .delete(cartItems)
      .where(
        sql`${cartItems.cartId} IN (SELECT id FROM carts WHERE user_id = ${userId})`,
      );
    await tx.delete(carts).where(eq(carts.userId, userId));
    await tx.delete(addresses).where(eq(addresses.userId, userId));
    await tx.delete(accounts).where(eq(accounts.userId, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

    if (existing.email) {
      await tx
        .delete(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, existing.email));
      await tx
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, existing.email));
      // auth_rate_limit_hits has no userId FK; rows are keyed by composite
      // identifier strings like "email:foo@bar.com" or "ip:1.2.3.4".
      await tx.execute(
        sql`DELETE FROM auth_rate_limit_hits WHERE identifier LIKE '%:' || ${existing.email}`,
      );
    }

    // ── ANONYMIZE rows the law requires us to keep ──

    // orders: strip PII from address jsonb snapshots.
    // orders.userId has onDelete: "set null" so the FK is already nullable.
    // We do not null the userId here — we keep it for accounting traceability.
    await tx.execute(sql`
      UPDATE orders
      SET
        shipping_address_snapshot = CASE
          WHEN shipping_address_snapshot IS NULL THEN NULL
          ELSE shipping_address_snapshot
            - 'firstName' - 'lastName' - 'phone'
            - 'line1' - 'line2' - 'postalCode'
        END,
        billing_address_snapshot = CASE
          WHEN billing_address_snapshot IS NULL THEN NULL
          ELSE billing_address_snapshot
            - 'firstName' - 'lastName' - 'phone'
            - 'line1' - 'line2' - 'postalCode'
        END
      WHERE user_id = ${userId}
    `);

    // subscriptions: anonymize the shipping address snapshot.
    // The userId FK has onDelete: "cascade" — but since we are updating (not
    // deleting) the user row, the cascade will NOT fire. We anonymize the
    // snapshot before touching the user row.
    await tx.execute(sql`
      UPDATE subscriptions
      SET shipping_address_snapshot =
        shipping_address_snapshot
          - 'firstName' - 'lastName' - 'phone'
          - 'line1' - 'line2' - 'postalCode'
      WHERE user_id = ${userId}
    `);

    // gift_cards: clear purchaserEmail for this user's purchases.
    // purchaserUserId already has onDelete: "set null" but we also wipe the
    // email field which is a plain text column (not a FK).
    await tx
      .update(giftCards)
      .set({ purchaserEmail: sentinel })
      .where(eq(giftCards.purchaserUserId, userId));

    // b2b_quote_requests: no customer userId FK — quotedBy is an admin FK.
    // Cannot correlate quote rows to a purged customer; no action.

    // ── Final: scrub the user row, set tombstone ──
    await tx
      .update(users)
      .set({
        email: sentinel,
        name: null,
        image: null,
        passwordHash: null,
        newsletterOptIn: false,
        deletedAt: null,
        cancelDeletionToken: null,
        cancelDeletionExpiresAt: null,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
        emailChangeUndoToken: null,
        emailChangeUndoExpiresAt: null,
        emailChangeUndoTo: null,
        purgedAt: new Date(),
      })
      .where(eq(users.id, userId));
  });
}
