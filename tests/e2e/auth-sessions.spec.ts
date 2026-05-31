import { test, expect } from "@playwright/test";

test("sessions block not visible to anonymous user", async ({ page }) => {
  await page.goto("/fr/compte/profil");
  // Redirect to sign-in: anonymous user never sees the connected-devices block.
  await expect(page.getByText(/appareils connect/i)).not.toBeVisible();
});
