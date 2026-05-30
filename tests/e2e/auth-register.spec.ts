import { test, expect } from "@playwright/test";

const uniqueEmail = () => `test+${Date.now()}@e2e-au-fil.test`;

test("sign-up page renders fields + Google", async ({ page }) => {
  await page.goto("/fr/sign-up");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await expect(page.getByLabel("Confirmer le mot de passe")).toBeVisible();
  await expect(page.getByLabel(/j'accepte les cgv/i)).toBeVisible();
});

test("password mismatch redirects with error", async ({ page }) => {
  await page.goto("/fr/sign-up");
  await page.getByLabel("Adresse email").fill(uniqueEmail());
  await page.getByLabel("Mot de passe").fill("correctpassword12");
  await page.getByLabel("Confirmer le mot de passe").fill("differentpass12");
  await page.getByLabel(/j'accepte les cgv/i).check();
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/error=password-mismatch/);
});

test("successful register lands on /compte with welcome banner", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/fr/sign-up");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe").fill("strongpassword12");
  await page.getByLabel("Confirmer le mot de passe").fill("strongpassword12");
  await page.getByLabel(/j'accepte les cgv/i).check();
  await page.getByRole("button", { name: /créer mon compte/i }).click();
  await expect(page).toHaveURL(/\/fr\/compte\?welcome=1/);
  await expect(page.getByText(/vérifie ton email/i)).toBeVisible();
});
