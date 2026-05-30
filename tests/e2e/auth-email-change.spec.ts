import { test, expect } from "@playwright/test";

test("expired email-change confirm token shows expired screen", async ({ page }) => {
  await page.goto("/fr/confirm-email-change/this-is-not-a-real-token");
  await expect(page.getByText(/expir[eé]/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /profil/i })).toBeVisible();
});

test("expired email-change undo token shows undo-expired screen", async ({ page }) => {
  await page.goto("/fr/undo-email-change/this-is-not-a-real-token");
  await expect(page.getByText(/expir[eé]/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /connexion/i })).toBeVisible();
});

test("unauthenticated /compte/profil redirects to /sign-in", async ({ page }) => {
  await page.goto("/fr/compte/profil");
  await expect(page).toHaveURL(/\/fr\/sign-in/);
});
