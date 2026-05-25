import { Fragment, type ReactNode } from "react";
import { toSlug } from "@/lib/slug";
import type { Mark, ProseMirrorNode } from "./prosemirror-types";
import { Callout } from "@/components/journal/Callout";
import { VideoEmbed } from "@/components/journal/VideoEmbed";
import { InlineProductCard } from "@/components/journal/InlineProductCard";
import { Figure } from "@/components/journal/Figure";

function withMarks(text: string, marks: Mark[] | undefined): ReactNode {
  if (!marks?.length) return text;
  return marks.reduce<ReactNode>((acc, m) => {
    if (m.type === "bold") return <strong>{acc}</strong>;
    if (m.type === "italic") return <em>{acc}</em>;
    if (m.type === "link") {
      return (
        <a href={m.attrs?.href ?? "#"} className="text-honey-dark underline">
          {acc}
        </a>
      );
    }
    return acc;
  }, text);
}

function nodeText(node: ProseMirrorNode): string {
  if (node.type === "text") return node.text;
  if ("content" in node && Array.isArray(node.content)) {
    return node.content.map(nodeText).join("");
  }
  return "";
}

export function renderArticleBody(
  node: ProseMirrorNode,
  key = "root",
): ReactNode {
  switch (node.type) {
    case "doc":
      return (
        <>
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </>
      );
    case "paragraph":
      return (
        <p>
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </p>
      );
    case "heading": {
      const text = (node.content ?? []).map(nodeText).join("");
      const id = toSlug(text);
      const Tag = (`h${node.attrs.level}`) as "h2" | "h3";
      return (
        <Tag id={id}>
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </Tag>
      );
    }
    case "text":
      return withMarks(node.text, node.marks);
    case "blockquote":
      return (
        <blockquote className="font-display border-honey/30 my-6 border-l-4 pl-6 text-2xl italic">
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul className="list-disc pl-6">
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal pl-6">
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </ol>
      );
    case "listItem":
      return (
        <li>
          {node.content?.map((c, i) => (
            <Fragment key={i}>{renderArticleBody(c, `${key}.${i}`)}</Fragment>
          ))}
        </li>
      );
    case "image":
      return (
        <Figure
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          caption={node.attrs.caption}
        />
      );
    case "video-embed":
      return (
        <VideoEmbed
          provider={node.attrs.provider}
          videoId={node.attrs.videoId}
        />
      );
    case "video-upload":
      return (
        <video
          controls
          preload="metadata"
          src={node.attrs.src}
          poster={node.attrs.poster ?? undefined}
          className="my-6 w-full rounded"
        />
      );
    case "product-card":
      return <InlineProductCard slug={node.attrs.productSlug} />;
    case "callout":
      return <Callout variant={node.attrs.variant}>{node.attrs.text}</Callout>;
    default:
      return null;
  }
}
