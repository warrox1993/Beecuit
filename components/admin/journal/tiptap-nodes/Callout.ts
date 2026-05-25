import { Node, mergeAttributes } from "@tiptap/core";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      variant: { default: "note" as "note" | "astuce" | "attention" },
      text: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-callout": "" }, HTMLAttributes)];
  },
});
