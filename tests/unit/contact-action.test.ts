import { describe, expect, it, vi, beforeEach } from "vitest";

const inserted: unknown[] = [];
vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({ values: (v: unknown) => { inserted.push(v); return Promise.resolve(); } }),
  },
}));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(new Headers({ "x-forwarded-for": "9.9.9.9" })) }));
vi.mock("@/lib/queries/contact", () => ({ countRecentByIp: vi.fn(async () => 0) }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { submitContactMessage, adminUpdateMessageStatus } from "@/lib/actions/contact.actions";
import { countRecentByIp } from "@/lib/queries/contact";
import { auth } from "@/lib/auth";

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}
const valid = { name: "Jean", email: "JEAN@Example.com", reason: "order", message: "Bonjour, une question sur ma commande.", locale: "fr" };

beforeEach(() => { inserted.length = 0; vi.mocked(countRecentByIp).mockResolvedValue(0); });

describe("submitContactMessage", () => {
  it("insère un message valide (email normalisé) et renvoie ok", async () => {
    const res = await submitContactMessage(fd(valid));
    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
    expect((inserted[0] as { email: string }).email).toBe("jean@example.com");
    expect((inserted[0] as { sourceIp: string }).sourceIp).toBe("9.9.9.9");
  });

  it("rejette une saisie invalide (message trop court) sans insérer", async () => {
    const res = await submitContactMessage(fd({ ...valid, message: "court" }));
    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("rejette une raison hors enum", async () => {
    const res = await submitContactMessage(fd({ ...valid, reason: "hack" }));
    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("honeypot rempli → ok factice, aucun insert", async () => {
    const res = await submitContactMessage(fd({ ...valid, company: "Acme Bot" }));
    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(0);
  });

  it("rate-limit (>=3 récents) → rejet sans insert", async () => {
    vi.mocked(countRecentByIp).mockResolvedValue(3);
    const res = await submitContactMessage(fd(valid));
    expect(res).toEqual({ ok: false, error: "rate-limit" });
    expect(inserted).toHaveLength(0);
  });
});

describe("adminUpdateMessageStatus (contrôle d'accès)", () => {
  const okId = "550e8400-e29b-41d4-a716-446655440000";

  it("rejette un visiteur non authentifié / non-admin", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const res = await adminUpdateMessageStatus(fd({ id: okId, status: "read" }));
    expect(res).toEqual({ ok: false, error: "forbidden" });
  });

  it("rejette un utilisateur 'customer' (rôle non admin)", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: "customer" } } as never);
    const res = await adminUpdateMessageStatus(fd({ id: okId, status: "read" }));
    expect(res).toEqual({ ok: false, error: "forbidden" });
  });

  it("rejette un id non-uuid même pour un admin (avant tout accès DB)", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { role: "admin" } } as never);
    const res = await adminUpdateMessageStatus(fd({ id: "not-a-uuid", status: "read" }));
    expect(res).toEqual({ ok: false, error: "invalid" });
  });
});
