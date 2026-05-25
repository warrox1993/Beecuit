import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as React from "react";

const mockBatchSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: vi.fn() };
    batch = { send: mockBatchSend };
  },
}));

// Stub env so transitive validation doesn't blow up under test.
vi.mock("@/lib/env", () => ({
  env: {
    AUTH_RESEND_KEY: "re_test",
    AUTH_EMAIL_FROM: "test@beecuit.test",
  },
}));

beforeEach(() => mockBatchSend.mockReset());

describe("sendBatchEmails", () => {
  it("chunks payloads into batches of 100", async () => {
    const { sendBatchEmails } = await import("@/lib/email/client");
    mockBatchSend.mockResolvedValue({ data: { data: [] }, error: null });
    const payloads = Array.from({ length: 250 }, (_, i) => ({
      to: `u${i}@x.com`,
      subject: "S",
      react: { type: "div", props: { children: "x" } } as unknown as React.ReactElement,
    }));
    await sendBatchEmails(payloads);
    expect(mockBatchSend).toHaveBeenCalledTimes(3); // 100 + 100 + 50
  });
  it("returns per-payload result for traceability", async () => {
    const { sendBatchEmails } = await import("@/lib/email/client");
    mockBatchSend.mockResolvedValue({
      data: { data: [{ id: "re_1" }, { id: "re_2" }] },
      error: null,
    });
    const results = await sendBatchEmails([
      { to: "a@x.com", subject: "S", react: {} as React.ReactElement },
      { to: "b@x.com", subject: "S", react: {} as React.ReactElement },
    ]);
    expect(results).toEqual([
      { to: "a@x.com", status: "sent", resendId: "re_1" },
      { to: "b@x.com", status: "sent", resendId: "re_2" },
    ]);
  });
});
