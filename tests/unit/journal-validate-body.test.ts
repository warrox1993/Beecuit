import { describe, it, expect } from "vitest";
import { validateBody } from "@/lib/journal/validate-body";

describe("validateBody", () => {
  it("accepts a minimal valid doc", () => {
    expect(() => validateBody({ type: "doc", content: [] })).not.toThrow();
  });
  it("rejects a non-doc root", () => {
    expect(() => validateBody({ type: "paragraph" })).toThrow(/root must be doc/i);
  });
  it("rejects unknown node types", () => {
    const doc = { type: "doc", content: [{ type: "evilScript", content: [] }] };
    expect(() => validateBody(doc)).toThrow(/disallowed node type/i);
  });
  it("rejects unknown mark types", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "hi", marks: [{ type: "danger" }] }],
        },
      ],
    };
    expect(() => validateBody(doc)).toThrow(/disallowed mark/i);
  });
  it("rejects video-embed without provider", () => {
    const doc = { type: "doc", content: [{ type: "video-embed", attrs: { url: "x" } }] };
    expect(() => validateBody(doc)).toThrow();
  });
});
