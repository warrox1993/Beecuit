import { Node, mergeAttributes } from "@tiptap/core";

export const VideoUpload = Node.create({
  name: "video-upload",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: "" },
      poster: { default: null as string | null },
      blobPath: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-video-upload]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-video-upload": "" }, HTMLAttributes)];
  },
});
