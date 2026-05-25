import { Node, mergeAttributes } from "@tiptap/core";

export const VideoEmbed = Node.create({
  name: "video-embed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      provider: { default: "youtube" as "youtube" | "vimeo" },
      url: { default: "" },
      videoId: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-video-embed]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-video-embed": "" }, HTMLAttributes)];
  },
});
