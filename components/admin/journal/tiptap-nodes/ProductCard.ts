import { Node, mergeAttributes } from "@tiptap/core";

export const ProductCard = Node.create({
  name: "product-card",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      productSlug: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-product-card]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-product-card": "" }, HTMLAttributes)];
  },
});
