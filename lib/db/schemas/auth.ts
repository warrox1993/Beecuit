import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["customer", "b2b", "admin"]);
export const locale = pgEnum("locale", ["fr", "nl", "de", "en"]);

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    passwordHash: text("password_hash"),
    role: userRole("role").notNull().default("customer"),
    preferredLocale: locale("preferred_locale").notNull().default("fr"),
    newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    // ── v2 Sprint A : account actions ──
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    cancelDeletionToken: text("cancel_deletion_token"),
    cancelDeletionExpiresAt: timestamp("cancel_deletion_expires_at", { mode: "date" }),
    pendingEmail: text("pending_email"),
    pendingEmailToken: text("pending_email_token"),
    pendingEmailExpiresAt: timestamp("pending_email_expires_at", { mode: "date" }),
    emailChangeUndoToken: text("email_change_undo_token"),
    emailChangeUndoExpiresAt: timestamp("email_change_undo_expires_at", { mode: "date" }),
    emailChangeUndoTo: text("email_change_undo_to"),
    purgedAt: timestamp("purged_at", { mode: "date" }),
    // ── v2 Sprint B : 2FA ──
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabledAt: timestamp("two_factor_enabled_at", { mode: "date" }),
    twoFactorDisableToken: text("two_factor_disable_token"),
    twoFactorDisableExpiresAt: timestamp("two_factor_disable_expires_at", { mode: "date" }),
  },
  (table) => ({
    deletedAtIdx: index("users_deleted_at_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NOT NULL`),
    pendingEmailTokenIdx: index("users_pending_email_token_idx")
      .on(table.pendingEmailToken)
      .where(sql`${table.pendingEmailToken} IS NOT NULL`),
    cancelDeletionTokenIdx: index("users_cancel_deletion_token_idx")
      .on(table.cancelDeletionToken)
      .where(sql`${table.cancelDeletionToken} IS NOT NULL`),
    emailChangeUndoTokenIdx: index("users_email_change_undo_token_idx")
      .on(table.emailChangeUndoToken)
      .where(sql`${table.emailChangeUndoToken} IS NOT NULL`),
    twoFactorDisableTokenIdx: index("users_2fa_disable_token_idx")
      .on(table.twoFactorDisableToken)
      .where(sql`${table.twoFactorDisableToken} IS NOT NULL`),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  // ── v2 Sprint B : session metadata ──
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { mode: "date" }),
  userAgent: text("user_agent"),
  ip: text("ip"),
  city: text("city"),
  country: text("country"),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);
