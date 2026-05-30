import { test, expect } from "@playwright/test";

test("expired cancel-deletion token shows expired screen", async ({ page }) => {
  await page.goto("/fr/cancel-deletion/this-is-not-a-real-token");
  await expect(page.getByText(/trop tard|d[eé]finitivement/i)).toBeVisible();
});

test("danger zone form not visible to anonymous user", async ({ page }) => {
  await page.goto("/fr/compte/profil");
  // Redirect to sign-in: never see the danger zone heading.
  await expect(page.getByText(/zone de danger/i)).not.toBeVisible();
});
