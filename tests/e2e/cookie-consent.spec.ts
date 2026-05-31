import { test, expect } from "@playwright/test";

test("le bandeau cookies apparaît, puis disparaît après Refuser et ne revient pas", async ({ page }) => {
  await page.goto("/fr/cgv");
  const banner = page.getByRole("dialog", { name: /cookies/i });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: /Refuser/i }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("dialog", { name: /cookies/i })).toBeHidden();
});

test("« Gérer les cookies » rouvre les préférences", async ({ page, baseURL }) => {
  // pré-consentir pour masquer le bandeau initial
  const consent = encodeURIComponent(
    JSON.stringify({ v: 1, analytics: false, marketing: false, ts: Date.now() }),
  );
  await page.context().addCookies([
    { name: "cookie_consent", value: consent, url: baseURL ?? "http://localhost:3000" },
  ]);
  await page.goto("/fr/cgv");
  await expect(page.getByRole("dialog", { name: /cookies/i })).toBeHidden();
  await page.getByRole("button", { name: /Gérer les cookies/i }).first().click();
  await expect(page.getByRole("button", { name: /Enregistrer mes choix/i })).toBeVisible();
});
