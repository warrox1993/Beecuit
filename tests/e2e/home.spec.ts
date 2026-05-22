import { test, expect } from "@playwright/test";

test("home page renders BeeCuit title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BeeCuit");
});
