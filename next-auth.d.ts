import type { DefaultSession } from "next-auth";
import type { userRole } from "@/lib/db/schemas/auth";

type UserRole = (typeof userRole.enumValues)[number];

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole;
  }
}
