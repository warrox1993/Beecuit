import { test, expect } from "@playwright/test";

test("guest can fill the gift card form and add to cart", async ({ page }) => {
  await page.goto("/fr/cartes-cadeaux");
  await expect(
    page.getByRole("heading", { name: /offre beecuit/i }),
  ).toBeVisible();

  // Pick 25 € amount (second tier)
  await page.getByRole("button", { name: "25 €" }).click();

  await page.getByPlaceholder("marie@exemple.be").fill("recipient-e2e@test.com");

  await page.getByRole("button", { name: /Ajouter au panier — 25/ }).click();

  await expect(page).toHaveURL(/\/fr\/panier/);
  await expect(
    page.getByText("recipient-e2e@test.com", { exact: false }),
  ).toBeVisible();
});
