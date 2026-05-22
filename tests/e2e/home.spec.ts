import { test, expect } from "@playwright/test";

const expected = {
  fr: { title: "BeeCuit", tagline: "Biscuits artisanaux de Liège" },
  nl: { title: "BeeCuit", tagline: "Ambachtelijke koekjes uit Luik" },
  de: { title: "BeeCuit", tagline: "Handwerkliche Kekse aus Lüttich" },
  en: { title: "BeeCuit", tagline: "Artisan biscuits from Liège" },
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
