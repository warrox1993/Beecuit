import { getTranslations } from "next-intl/server";
import Link from "next/link";

type Article = {
  slug: string;
  recipePrepMin: number | null;
  recipeCookMin: number | null;
  recipeDifficulty: "facile" | "moyen" | "avance" | null;
};

type Translation = {
  recipeYieldLabel: string | null;
  recipeIngredients: Array<{ name: string; qty: string; unit: string }> | null;
};

export async function RecipeBlock({
  article,
  translation,
  locale,
}: {
  article: Article;
  translation: Translation;
  locale: "fr" | "nl" | "en" | "de";
}) {
  const t = await getTranslations("journal.recipe");
  return (
    <aside className="bg-cream-gold/40 border-honey/30 my-8 rounded-lg border p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-warm-brown font-display text-2xl">{t("ingredients")}</h3>
          <ul className="mt-3 space-y-1.5">
            {translation.recipeIngredients?.map((i, idx) => (
              <li key={idx} className="text-warm-brown/85 text-sm">
                <strong className="text-warm-brown">
                  {i.qty}
                  {i.unit ? ` ${i.unit}` : ""}
                </strong>{" "}
                {i.name}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {translation.recipeYieldLabel && (
            <>
              <dt className="text-warm-brown/60">{t("yield")}</dt>
              <dd className="text-warm-brown font-medium">{translation.recipeYieldLabel}</dd>
            </>
          )}
          {article.recipePrepMin != null && (
            <>
              <dt className="text-warm-brown/60">{t("prep")}</dt>
              <dd className="text-warm-brown font-medium">{article.recipePrepMin} min</dd>
            </>
          )}
          {article.recipeCookMin != null && (
            <>
              <dt className="text-warm-brown/60">{t("cook")}</dt>
              <dd className="text-warm-brown font-medium">{article.recipeCookMin} min</dd>
            </>
          )}
          {article.recipeDifficulty && (
            <>
              <dt className="text-warm-brown/60">{t("difficulty")}</dt>
              <dd className="text-warm-brown font-medium capitalize">
                {article.recipeDifficulty}
              </dd>
            </>
          )}
        </dl>
      </div>
      <Link
        href={`/print-journal/${locale}/${article.slug}`}
        target="_blank"
        className="text-honey-dark mt-6 inline-block text-sm underline hover:no-underline"
      >
        {t("print")}
      </Link>
    </aside>
  );
}

RecipeBlock.Steps = async function Steps({
  steps,
  locale,
}: {
  steps: Array<{ n: number; text: string }>;
  locale: "fr" | "nl" | "en" | "de";
}) {
  const t = await getTranslations("journal.recipe");
  void locale;
  return (
    <section className="my-10">
      <h3 className="text-warm-brown font-display text-2xl">{t("steps")}</h3>
      <ol className="mt-6 space-y-6">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-5">
            <span className="text-honey-dark font-display text-4xl leading-none">{s.n}</span>
            <p className="text-warm-brown/85 flex-1 leading-relaxed">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};
