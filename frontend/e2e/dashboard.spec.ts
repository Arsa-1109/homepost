import { expect, test } from "@playwright/test";

/**
 * C4 — dashboard smoke: after sign-in the landlord dashboard hydrates from
 * the stubbed API (bento stats + unit cards) instead of hanging on skeletons.
 */
async function signInAsLandlord(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /continue as landlord/i }).click();
  await page.waitForURL("**/landlord/dashboard", { timeout: 30_000 });
}

test("landlord dashboard renders stubbed property data", async ({ page }) => {
  await signInAsLandlord(page);

  await expect(page.getByText("Oakview E2E Residency").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /unit 101/i })).toBeVisible();
  await expect(page.getByText("Total units")).toBeVisible();
  await expect(page.getByText("50% occupancy")).toBeVisible();
});
