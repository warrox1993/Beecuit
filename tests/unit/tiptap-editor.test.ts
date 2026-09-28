// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Editor, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Callout,
  ProductCard,
  VideoEmbed,
  VideoUpload,
} from "@/components/admin/journal/tiptap-nodes";

// Même liste d'extensions que components/admin/journal/TiptapEditor.tsx : garantit que
// @tiptap/core et les extensions (versions distinctes dans le lockfile) restent compatibles.
function makeEditor(content: unknown) {
  return new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: false }),
      Image.configure({ inline: false }),
      VideoEmbed,
      VideoUpload,
      ProductCard,
      Callout,
    ],
    content: content as never,
  });
}

describe("éditeur Tiptap du journal", () => {
  it("charge un document et le restitue à l'identique", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Recette" }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Voir la boutique",
              marks: [{ type: "link", attrs: { href: "https://beecuit.vercel.app/fr" } }],
            },
          ],
        },
        { type: "callout", attrs: { variant: "astuce", text: "Beurre bien froid" } },
      ],
    };
    const editor = makeEditor(doc);
    const json = editor.getJSON();
    expect(json.content?.[0]).toMatchObject(doc.content[0]!);
    expect(json.content?.[2]).toMatchObject(doc.content[2]!);
    const html = editor.getHTML();
    expect(html).toContain("<h2>Recette</h2>");
    expect(html).toContain('href="https://beecuit.vercel.app/fr"');
    expect(html).toContain("data-callout");
    editor.destroy();
  });

  it("mergeAttributes ne transforme pas une clé __proto__ en attribut hérité (GHSA, @tiptap/core >= 3.30.4)", () => {
    const hostile = JSON.parse('{"__proto__": {"onclick": "alert(1)"}}') as Record<string, unknown>;
    const merged = mergeAttributes({ class: "a" }, hostile) as Record<string, unknown>;
    expect("onclick" in merged).toBe(false);
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
  });
});
