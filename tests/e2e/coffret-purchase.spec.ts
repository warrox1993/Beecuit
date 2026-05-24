import { test, expect } from "@playwright/test";

test("guest can browse coffret and add to cart with gift + premium", async ({
  page,
}) => {
  await page.goto("/fr/coffrets");
  await expect(
    page.getByRole("heading", { name: /coffrets cadeaux/i }),
  ).toBeVisible();

  // Click the Découverte coffret card
  await page.getByRole("link", { name: /Coffret Découverte/i }).first().click();
  await expect(page).toHaveURL(/\/fr\/coffrets\/coffret-decouverte/);

  // Fill gift message + choose premium packaging
  await page
    .getByPlaceholder(/Joyeux anniversaire/i)
    .fill("Test E2E — message cadeau");
  await page.getByRole("button", { name: /^Premium/ }).click();

  // Add to cart
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();

  // Cart page reflects gift + premium
  await page.goto("/fr/panier");
  await expect(
    page.getByText("Test E2E — message cadeau", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/Emballage premium/i).first()).toBeVisible();
});
