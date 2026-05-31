import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui-primitives/Section";
import { Container } from "@/components/ui-primitives/Container";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { PlaceholderText } from "@/components/legal/Placeholder";
import { getLegalDocument, type LegalPageKey } from "@/content/legal";
import type { LegalBlock } from "@/content/legal/types";

function BlockView({ block }: { block: LegalBlock }) {
  if (block.type === "subheading") {
    return (
      <h3 className="text-warm-brown mt-6 text-base font-semibold">
        <PlaceholderText text={block.text} />
      </h3>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="text-warm-brown/80 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {block.items.map((it, i) => (
          <li key={i}>
            <PlaceholderText text={it} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-warm-brown/80 text-sm leading-relaxed">
      <PlaceholderText text={block.text} />
    </p>
  );
}

export async function LegalPage({ pageKey, locale }: { pageKey: LegalPageKey; locale: string }) {
  const t = await getTranslations("legal");
  const doc = getLegalDocument(pageKey, locale);
  return (
    <Section py="lg">
      <Container variant="narrow">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3">
          {doc.title}
        </Heading>
        <p className="text-warm-brown/50 mt-3 text-xs">
          <PlaceholderText text={doc.lastUpdatedLabel} />
        </p>
        {doc.intro && (
          <Prose className="mt-6">
            <p>
              <PlaceholderText text={doc.intro} />
            </p>
          </Prose>
        )}
        <div className="mt-10 space-y-10">
          {doc.sections.map((s, i) => (
            <section key={i}>
              <Heading as="h2" size="h3">
                {s.heading}
              </Heading>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, j) => (
                  <BlockView key={j} block={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
