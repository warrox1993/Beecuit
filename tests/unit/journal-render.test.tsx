import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { renderArticleBody } from "@/lib/journal/render";
import type { ProseMirrorNode } from "@/lib/journal/prosemirror-types";

describe("renderArticleBody", () => {
  it("renders headings with anchor ids", () => {
    const doc: ProseMirrorNode = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Préparation" }],
        },
      ],
    };
    const html = renderToString(<>{renderArticleBody(doc)}</>);
    expect(html).toContain('id="preparation"');
    expect(html).toContain("Préparation");
  });

  it("renders bold/italic marks", () => {
    const doc: ProseMirrorNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello ", marks: [{ type: "bold" }] },
            { type: "text", text: "world", marks: [{ type: "italic" }] },
          ],
        },
      ],
    };
    const html = renderToString(<>{renderArticleBody(doc)}</>);
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
  });

  it("renders callout with variant text", () => {
    const doc: ProseMirrorNode = {
      type: "doc",
      content: [
        { type: "callout", attrs: { variant: "astuce", text: "Pro tip" } },
      ],
    };
    const html = renderToString(<>{renderArticleBody(doc)}</>);
    expect(html).toContain("Pro tip");
  });
});
