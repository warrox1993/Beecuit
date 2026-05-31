import { describe, expect, it, vi, beforeEach } from "vitest";
import { purgeUser } from "@/lib/auth/account-purge";

// Mock the db module — the test asserts that purgeUser issues the expected
// sequence of statements without hitting a real DB.
const calls: Array<{ kind: string; args: unknown[] }> = [];

vi.mock("@/lib/db", () => {
  const tx = {
    update: (table: unknown) => ({
      set: (vals: unknown) => ({
        where: (cond: unknown) => {
          calls.push({ kind: "update", args: [table, vals, cond] });
          return Promise.resolve();
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: (cond: unknown) => {
        calls.push({ kind: "delete", args: [table, cond] });
        return Promise.resolve();
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: "user-x",
                email: "x@example.test",
                purgedAt: null,
                // deletion still pending (required by the cancellation-race guard)
                deletedAt: new Date("2020-01-01"),
              },
            ]),
        }),
      }),
    }),
    execute: (q: unknown) => {
      calls.push({ kind: "execute", args: [q] });
      return Promise.resolve({ rows: [] });
    },
  };
  return {
    db: {
      transaction: async <T>(fn: (t: typeof tx) => Promise<T>) => fn(tx),
      select: tx.select,
    },
  };
});

beforeEach(() => {
  calls.length = 0;
});

describe("purgeUser", () => {
  it("performs delete + anonymize statements wrapped in a transaction", async () => {
    await purgeUser("user-x");
    expect(calls.length).toBeGreaterThan(5);
    // at least one user UPDATE setting purged_at + sentinel email
    const userUpdate = calls.find(
      (c) =>
        c.kind === "update" &&
        JSON.stringify(c.args[1]).includes("purgedAt") &&
        JSON.stringify(c.args[1]).includes("deleted-user-x@anon.invalid"),
    );
    expect(userUpdate).toBeDefined();
  });

  it("is idempotent — purging the same user twice doesn't throw", async () => {
    await purgeUser("user-x");
    calls.length = 0;
    await expect(purgeUser("user-x")).resolves.not.toThrow();
  });
});
