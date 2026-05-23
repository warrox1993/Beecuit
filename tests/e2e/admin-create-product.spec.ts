import { test, expect } from "@playwright/test";

test.skip("admin form refuses save when one translation is incomplete", async ({ page }) => {
  // TODO: enable once admin storage state setup is added (Phase 5 polish)
  await page.goto("/admin/produits/nouveau");
  await page.getByPlaceholder(/SKU/i).fill("BCT-E2E-001");
  // Fill FR only (skip NL/DE/EN tabs)
  // ... the implementer wiring would go here ...
  const submit = page.getByRole("button", { name: /Créer/ });
  await expect(submit).toBeDisabled();
});
