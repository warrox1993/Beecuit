import { test, expect } from "@playwright/test";

const expected = {
  fr: {
    tagline: "Biscuits artisanaux de Liège",
    heroTitle: "Le biscuit belge,",
  },
  nl: {
    tagline: "Ambachtelijke koekjes uit Luik",
    heroTitle: "Het Belgische koekje,",
  },
  de: {
    tagline: "Handwerkliche Kekse aus Lüttich",
    heroTitle: "Das belgische Gebäck,",
  },
  en: {
    tagline: "Artisan biscuits from Liège",
    heroTitle: "The Belgian biscuit,",
  },
} as const;

for (const [locale, content] of Object.entries(expected)) {
  test(`home page renders in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    // Hero H1 contains the localized title (Phase 4B editorial layout)
    await expect(page.getByRole("heading", { level: 1 })).toContainText(content.heroTitle);
    // Tagline lives in footer + page metadata
    await expect(page.getByText(content.tagline).first()).toBeVisible();
  });
}

test("root path redirects to default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
});
