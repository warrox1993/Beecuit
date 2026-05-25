export type Mark = { type: "bold" | "italic" | "link"; attrs?: { href?: string } };

export type ImageAttrs = { src: string; alt: string; caption?: string; blobPath: string };
export type VideoEmbedAttrs = { provider: "youtube" | "vimeo"; url: string; videoId: string };
export type VideoUploadAttrs = { src: string; poster?: string; blobPath: string };
export type ProductCardAttrs = { productSlug: string };
export type CalloutAttrs = { variant: "note" | "astuce" | "attention"; text: string };

export type ProseMirrorNode =
  | { type: "doc"; content: ProseMirrorNode[] }
  | { type: "paragraph"; content?: ProseMirrorNode[] }
  | { type: "heading"; attrs: { level: 2 | 3 }; content?: ProseMirrorNode[] }
  | { type: "text"; text: string; marks?: Mark[] }
  | { type: "blockquote"; content?: ProseMirrorNode[] }
  | { type: "bulletList"; content?: ProseMirrorNode[] }
  | { type: "orderedList"; content?: ProseMirrorNode[] }
  | { type: "listItem"; content?: ProseMirrorNode[] }
  | { type: "image"; attrs: ImageAttrs }
  | { type: "video-embed"; attrs: VideoEmbedAttrs }
  | { type: "video-upload"; attrs: VideoUploadAttrs }
  | { type: "product-card"; attrs: ProductCardAttrs }
  | { type: "callout"; attrs: CalloutAttrs };

export const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "image",
  "video-embed",
  "video-upload",
  "product-card",
  "callout",
]);

export const ALLOWED_MARK_TYPES = new Set(["bold", "italic", "link"]);
