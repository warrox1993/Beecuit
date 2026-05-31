import { describe, expect, it, vi, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { checkPasswordBreached } from "@/lib/auth/hibp";

afterEach(() => vi.restoreAllMocks());

function sha1Upper(s: string) {
  return createHash("sha1").update(s).digest("hex").toUpperCase();
}

describe("checkPasswordBreached", () => {
  it("returns breached when the suffix is present in the range response", async () => {
    const full = sha1Upper("hunter2");
    const suffix = full.slice(5);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`${suffix}:42\nFFFF:1`, { status: 200 })));
    const res = await checkPasswordBreached("hunter2");
    expect(res).toEqual({ breached: true, count: 42 });
  });

  it("returns not-breached when the suffix is absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ABCDE:1", { status: 200 })));
    expect((await checkPasswordBreached("zzz")).breached).toBe(false);
  });

  it("fails open on network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await checkPasswordBreached("whatever")).toEqual({ breached: false, count: 0 });
  });
});
