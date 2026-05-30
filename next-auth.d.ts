import type { DefaultSession } from "next-auth";
import type { userRole, locale } from "@/lib/db/schemas/auth";

type UserRole = (typeof userRole.enumValues)[number];
type UserLocale = (typeof locale.enumValues)[number];

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole; preferredLocale: UserLocale } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole;
    preferredLocale: UserLocale;
  }
}
