import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/journal/queries";

export const dynamic = "force-dynamic";

export default async function PrintJournalPage({
  params,
}: {
  params: Promise<{ locale: "fr" | "nl" | "en" | "de"; slug: string }>;
}) {
  const { locale, slug } = await params;
  const result = await getArticleBySlug(slug, locale);
  if (
    !result ||
    result.article.category !== "recettes" ||
    result.article.status !== "published"
  ) {
    notFound();
  }
  const t = result.translation ?? result.fallback;
  if (!t) notFound();

  const dateLabel = result.article.publishedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        result.article.publishedAt,
      )
    : "";

  return (
    <article className="print-doc">
      <h1>{t.title}</h1>
      <p className="meta">
        Par {result.article.author}
        {dateLabel ? ` · ${dateLabel}` : ""}
      </p>
      <hr />
      <p className="meta">
        {t.recipeYieldLabel ? (
          <>
            <strong>Pour&nbsp;:</strong> {t.recipeYieldLabel} ·{" "}
          </>
        ) : null}
        {result.article.recipePrepMin != null ? (
          <>
            <strong>Préparation&nbsp;:</strong> {result.article.recipePrepMin} min ·{" "}
          </>
        ) : null}
        {result.article.recipeCookMin != null ? (
          <>
            <strong>Cuisson&nbsp;:</strong> {result.article.recipeCookMin} min ·{" "}
          </>
        ) : null}
        {result.article.recipeDifficulty ? (
          <>
            <strong>Difficulté&nbsp;:</strong> {result.article.recipeDifficulty}
          </>
        ) : null}
      </p>
      <h2>Ingrédients</h2>
      <ul>
        {t.recipeIngredients?.map((i, idx) => (
          <li key={idx}>
            <strong>
              {i.qty}
              {i.unit ? ` ${i.unit}` : ""}
            </strong>{" "}
            {i.name}
          </li>
        )) ?? null}
      </ul>
      <h2>Étapes</h2>
      <ol>
        {t.recipeSteps?.map((s) => <li key={s.n}>{s.text}</li>) ?? null}
      </ol>
      <hr />
      <footer>
        aufildessaveurs.be/{locale}/journal/{slug} · © Au Fil des Saveurs
      </footer>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.addEventListener('load', () => setTimeout(() => window.print(), 200));",
        }}
      />
    </article>
  );
}
