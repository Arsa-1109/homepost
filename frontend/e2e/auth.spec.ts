import { expect, test } from "@playwright/test";

/**
 * C4 — auth smoke: sign-in flow routes each persona to their dashboard.
 * Uses the offline Clerk persona picker (MOCK_AUTH build).
 */
test("signing in as a landlord lands on the landlord dashboard", async ({ page }) => {
  await page.goto("/");

  // Landing header animates in; assert presence rather than clicking it.
  await expect(page.getByTestId("mock-signin")).toBeVisible({ timeout: 20_000 });

  await page.goto("/sign-in");
  await page.getByRole("button", { name: /continue as landlord/i }).click();

  await page.waitForURL("**/landlord/dashboard", { timeout: 30_000 });
});

test("signed-out users see the sign-in affordance; signed-in see their menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("mock-signin")).toBeVisible({ timeout: 20_000 });

  await page.goto("/sign-in");
  await page.getByRole("button", { name: /continue as tenant/i }).click();
  await page.waitForURL("**/tenant/dashboard", { timeout: 30_000 });

  await page.goto("/");
  await expect(page.getByTestId("mock-user-button")).toBeVisible({ timeout: 20_000 });
});
