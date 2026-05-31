import { test, expect } from "@playwright/test";

test("expired disable-2fa token shows expired screen", async ({ page }) => {
  await page.goto("/fr/disable-2fa/this-is-not-a-real-token");
  await expect(page.getByText(/lien expir|invalide/i)).toBeVisible();
});

test("/fr/sign-in/2fa without pending-2fa cookie redirects to sign-in", async ({ page }) => {
  await page.goto("/fr/sign-in/2fa");
  // No pending-2fa cookie → server redirects to /fr/sign-in?error=2fa-expired
  await expect(page).toHaveURL(/\/fr\/sign-in/);
});
