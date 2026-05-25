import * as React from "react";

export function JournalArticleEmail({
  title,
  excerpt,
  coverImage,
  articleUrl,
  unsubscribeUrl,
}: {
  title: string;
  excerpt: string;
  coverImage: string;
  articleUrl: string;
  unsubscribeUrl: string;
}) {
  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#fbf6ee",
        color: "#3d2817",
        padding: 32,
      }}
    >
      <img
        src={coverImage}
        alt=""
        style={{ width: "100%", maxWidth: 600, borderRadius: 8, display: "block" }}
      />
      <div
        style={{
          fontFamily: "Snell Roundhand, cursive",
          color: "#a8731b",
          marginTop: 24,
          fontSize: 22,
        }}
      >
        Au fil des saveurs &middot; Le journal
      </div>
      <h1 style={{ fontSize: 32, color: "#3d2817", marginTop: 12 }}>{title}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5 }}>{excerpt}</p>
      <a
        href={articleUrl}
        style={{
          display: "inline-block",
          padding: "12px 24px",
          background: "#a8731b",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 6,
          marginTop: 16,
        }}
      >
        Lire l&apos;article
      </a>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 32 }}>
        Vous recevez cet email parce que vous avez activé le journal.{" "}
        <a href={unsubscribeUrl} style={{ color: "#7a5a3c" }}>
          Se désabonner
        </a>
        .
      </p>
    </div>
  );
}
