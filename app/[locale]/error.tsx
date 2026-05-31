"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui-primitives/Section";
import { Container } from "@/components/ui-primitives/Container";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    // Surface the error for server/observability logs.
    console.error(error);
  }, [error]);

  return (
    <Section py="lg">
      <Container variant="narrow">
        <EmptyState
          title={t("title")}
          description={t("body")}
          cta={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={reset}
                className="bg-cta-primary text-cream hover:bg-cta-primary-hover h-auto rounded-full px-7 py-4 text-base"
              >
                {t("retry")}
              </Button>
              <Link
                href="/"
                className="text-warm-brown/70 hover:text-warm-brown text-sm underline-offset-4 hover:underline"
              >
                {t("home")}
              </Link>
            </div>
          }
        />
      </Container>
    </Section>
  );
}
