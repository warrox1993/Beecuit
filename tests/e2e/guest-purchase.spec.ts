import { test, expect } from "@playwright/test";

test.skip(
  "guest can browse, add to cart, and reach Stripe checkout",
  async ({ page }) => {
    // TODO: enable once STRIPE_SECRET_KEY is set to a real sk_test_xxx value
    await page.goto("/fr/biscuits");
    await page.locator("a", { hasText: /Spéculoos artisanal/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Spéculoos/);
    await page.getByRole("button", { name: /Ajouter au panier/ }).click();
    await page.getByRole("link", { name: "Panier" }).click();
    await expect(page).toHaveURL(/\/fr\/panier$/);
    await page.getByRole("link", { name: /Passer commande/ }).click();
    await expect(page).toHaveURL(/\/fr\/checkout$/);
    await page.getByPlaceholder("email@exemple.com").fill("guest+pw@example.com");
    await page.getByPlaceholder("firstName").fill("Test");
    await page.getByPlaceholder("lastName").fill("Guest");
    await page.getByPlaceholder("line1").fill("Rue de Test 1");
    await page.getByPlaceholder("postalCode").fill("4000");
    await page.getByPlaceholder("city").fill("Liège");
    await page.getByRole("button", { name: /Payer avec Stripe/ }).click();
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 15000 });
  },
);

test("guest can browse the catalog and add to cart (no Stripe)", async ({ page }) => {
  await page.goto("/fr/biscuits");
  // Click first product card (any seeded biscuit)
  await page.locator("a[href*='/biscuits/']").first().click();
  await page.waitForURL(/\/fr\/biscuits\/[\w-]+$/);
  // Add to cart — the label comes from the catalog.addToCart translation
  await page.getByRole("button", { name: /Ajouter au panier/ }).click();
  // Small delay for router.refresh to propagate the cart badge
  await page.waitForTimeout(500);
  // Navigate to cart via the aria-label link in the header
  await page.getByRole("link", { name: "Panier" }).click();
  await expect(page).toHaveURL(/\/fr\/panier$/);
  // Subtotal line must be visible (comes from cart.subtotal i18n key)
  await expect(page.getByText(/Sous-total/)).toBeVisible();
});
