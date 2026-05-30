import "server-only";
import { hash, verify } from "@node-rs/argon2";

// OWASP 2024 recommended Argon2id parameters.
// `algorithm` defaults to Argon2id in @node-rs/argon2 v2.x — omitted here
// because the exported `Algorithm` is a const enum, incompatible with our
// isolatedModules TS config.
const ARGON2_OPTIONS = {
  memoryCost: 19 * 1024, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}
