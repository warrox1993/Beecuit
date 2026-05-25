"use client";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { Content } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { VideoEmbed, VideoUpload, ProductCard, Callout } from "./tiptap-nodes";
import { useEffect, useRef } from "react";
import { uploadToBlob } from "@/lib/actions/blob-upload.actions";

export function TiptapEditor({
  initial,
  onChange,
}: {
  initial: unknown;
  onChange: (json: unknown) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: false }),
      Image.configure({ inline: false }),
      VideoEmbed,
      VideoUpload,
      ProductCard,
      Callout,
    ],
    content: initial as Content,
    immediatelyRender: false, // SSR-safe: render on client only
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  // If the initial doc changes (e.g., switching locale tabs), reset content
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const target = JSON.stringify(initial);
    if (current !== target)
      editor.commands.setContent(initial as Content, { emitUpdate: false });
  }, [initial, editor]);

  if (!editor)
    return <div className="text-warm-brown/50 p-4">Chargement de l&apos;éditeur…</div>;

  return (
    <div className="border-warm-brown/20 overflow-hidden rounded border bg-white">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h2]:text-warm-brown"
      />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btnBase =
    "px-2 py-1 rounded text-sm text-warm-brown hover:bg-honey/10 disabled:opacity-30";
  const btnActive = "bg-honey/20 text-honey-dark";

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-warm-brown/10 flex flex-wrap items-center gap-1 border-b bg-cream/30 p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${btnBase} ${editor.isActive("heading", { level: 2 }) ? btnActive : ""}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${btnBase} ${editor.isActive("heading", { level: 3 }) ? btnActive : ""}`}
      >
        H3
      </button>
      <span className="bg-warm-brown/10 mx-1 h-5 w-px" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnBase} ${editor.isActive("bold") ? btnActive : ""}`}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btnBase} ${editor.isActive("italic") ? btnActive : ""}`}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL du lien ?");
          if (!url) return;
          editor.chain().focus().toggleLink({ href: url }).run();
        }}
        className={`${btnBase} ${editor.isActive("link") ? btnActive : ""}`}
      >
        🔗
      </button>
      <span className="bg-warm-brown/10 mx-1 h-5 w-px" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${btnBase} ${editor.isActive("bulletList") ? btnActive : ""}`}
      >
        • Liste
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${btnBase} ${editor.isActive("orderedList") ? btnActive : ""}`}
      >
        1. Liste
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${btnBase} ${editor.isActive("blockquote") ? btnActive : ""}`}
      >
        ❝
      </button>
      <span className="bg-warm-brown/10 mx-1 h-5 w-px" />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const url = await downsizeAndUploadImage(file);
            editor.chain().focus().setImage({ src: url, alt: "" }).run();
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Erreur upload");
          } finally {
            if (imageInputRef.current) imageInputRef.current.value = "";
          }
        }}
      />
      <button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        className={btnBase}
      >
        🖼️ Img
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL YouTube ou Vimeo");
          if (!url) return;
          const ytMatch = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
          );
          const vmMatch = url.match(/vimeo\.com\/(\d+)/);
          const provider = ytMatch ? "youtube" : vmMatch ? "vimeo" : null;
          const videoId = ytMatch ? ytMatch[1] : vmMatch ? vmMatch[1] : null;
          if (!provider || !videoId) {
            window.alert("URL YouTube ou Vimeo invalide");
            return;
          }
          editor
            .chain()
            .focus()
            .insertContent({
              type: "video-embed",
              attrs: { provider, url, videoId },
            })
            .run();
        }}
        className={btnBase}
      >
        ▶️ Vidéo
      </button>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const fd = new FormData();
            fd.append("file", file);
            const result = await uploadToBlob(fd);
            editor
              .chain()
              .focus()
              .insertContent({
                type: "video-upload",
                attrs: {
                  src: result.url,
                  poster: null,
                  blobPath: result.pathname,
                },
              })
              .run();
          } catch (err) {
            window.alert(err instanceof Error ? err.message : "Erreur upload vidéo");
          } finally {
            if (videoInputRef.current) videoInputRef.current.value = "";
          }
        }}
      />
      <button
        type="button"
        onClick={() => videoInputRef.current?.click()}
        className={btnBase}
      >
        🎬 Upload Vidéo
      </button>
      <button
        type="button"
        onClick={() => {
          const slug = window.prompt("Slug du produit (ex: speculoos-tradition-petit-format)");
          if (!slug) return;
          editor
            .chain()
            .focus()
            .insertContent({
              type: "product-card",
              attrs: { productSlug: slug },
            })
            .run();
        }}
        className={btnBase}
      >
        🍯 Produit
      </button>
      <button
        type="button"
        onClick={() => {
          const variant = window.prompt("Variant : note / astuce / attention ?", "astuce");
          if (!variant || !["note", "astuce", "attention"].includes(variant)) return;
          const text = window.prompt("Texte du callout ?");
          if (!text) return;
          editor
            .chain()
            .focus()
            .insertContent({
              type: "callout",
              attrs: { variant, text },
            })
            .run();
        }}
        className={btnBase}
      >
        💡 Callout
      </button>
    </div>
  );
}

async function downsizeAndUploadImage(file: File): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new window.Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });
  const canvas = document.createElement("canvas");
  const maxW = 2000;
  const ratio = Math.min(1, maxW / img.width);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/jpeg",
      0.85,
    );
  });
  const fd = new FormData();
  fd.append(
    "file",
    new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }),
  );
  const result = await uploadToBlob(fd);
  return result.url;
}
