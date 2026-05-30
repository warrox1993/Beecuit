import { test, expect } from "@playwright/test";

test("unauthenticated /compte redirects to /sign-in", async ({ page }) => {
  await page.goto("/fr/compte");
  await expect(page).toHaveURL(/\/fr\/sign-in/);
});

test("sign-in page shows email + password + Google", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel(/Mot de passe$/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continuer avec google/i })).toBeVisible();
});

test("sign-in with bogus credentials shows generic error", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await page.getByLabel("Adresse email").fill("nope@nowhere.test");
  await page.getByLabel(/Mot de passe$/i).fill("not-the-real-password-1234");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page).toHaveURL(/error=invalid-credentials/);
  await expect(page.getByRole("alert")).toContainText(/incorrect/i);
});

test("forgot link points to forgot-password", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await page.getByRole("link", { name: /mot de passe oublié/i }).click();
  await expect(page).toHaveURL(/\/fr\/forgot-password$/);
});
