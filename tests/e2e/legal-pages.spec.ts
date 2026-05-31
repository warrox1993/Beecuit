import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/fr/cgv", h1: /Conditions g[ée]n[ée]rales de vente/i },
  { path: "/fr/mentions-legales", h1: /Mentions l[ée]gales/i },
  { path: "/fr/confidentialite", h1: /confidentialit[ée]/i },
  { path: "/fr/cookies", h1: /cookies/i },
];

for (const p of PAGES) {
  test(`${p.path} affiche son titre`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
  });
}
