import { test, expect } from "@playwright/test";

test("unauthenticated /compte redirects to /sign-in", async ({ page }) => {
  await page.goto("/fr/compte");
  await expect(page).toHaveURL(/\/fr\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Se connecter");
});

test("sign-in page renders the email form", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByRole("button", { name: /envoyer le lien/i })).toBeVisible();
});

test("check-email view shows the confirmation message", async ({ page }) => {
  await page.goto("/fr/sign-in?check=email");
  await expect(page.getByText(/v[ée]rifie ta bo[îi]te email/i)).toBeVisible();
});
