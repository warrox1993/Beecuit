import { test, expect } from "@playwright/test";

const expected = {
  fr: { title: "Au Fil des Saveurs", tagline: "Biscuits artisanaux de Liège" },
  nl: { title: "Au Fil des Saveurs", tagline: "Ambachtelijke koekjes uit Luik" },
  de: { title: "Au Fil des Saveurs", tagline: "Handwerkliche Kekse aus Lüttich" },
  en: { title: "Au Fil des Saveurs", tagline: "Artisan biscuits from Liège" },
} as const;

for (const [locale, content] of Object.entries(expected)) {
  test(`home page renders in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(content.title);
    await expect(page.getByText(content.tagline)).toBeVisible();
  });
}

test("root path redirects to default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
});
