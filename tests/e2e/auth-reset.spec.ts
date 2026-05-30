import { test, expect } from "@playwright/test";

test("forgot-password page renders + submits to generic confirmation", async ({ page }) => {
  await page.goto("/fr/forgot-password");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await page.getByLabel("Adresse email").fill("does-not-exist@nowhere.test");
  await page.getByRole("button", { name: /envoyer le lien/i }).click();
  await expect(page).toHaveURL(/sent=1/);
  await expect(page.getByText(/si un compte existe/i)).toBeVisible();
});

test("reset page with garbage token shows expired screen", async ({ page }) => {
  await page.goto("/fr/reset-password/this-is-not-a-real-token");
  await expect(page.getByText(/expiré ou déjà utilisé/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /demander un nouveau lien/i })).toBeVisible();
});
