import { test, expect } from "@playwright/test";

test("la page contact affiche le formulaire et soumet un message valide", async ({ page }) => {
  await page.goto("/fr/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Contactez-nous/i);
  await page.getByLabel(/Ton nom/i).fill("Jean Test E2E");
  await page.getByLabel(/Ton email/i).fill("jean.e2e@example.com");
  await page.getByLabel(/Sujet/i).selectOption("order");
  await page.getByLabel(/Ton message/i).fill("Bonjour, ceci est un message de test e2e suffisamment long.");
  await page.getByRole("button", { name: /Envoyer le message/i }).click();
  await expect(page.getByText(/ton message est bien arrivé/i)).toBeVisible();
});
