import { expect, test } from "@playwright/test";

/**
 * C4 — invite smoke: an unauthenticated visitor opens /join/[token], sees the
 * preview, signs in as a tenant, accepts, and lands on the tenant dashboard.
 */
test("tenant can preview and accept a unit invite", async ({ page }) => {
  await page.goto("/join/e2e-invite-token");

  await expect(
    page.getByRole("heading", { name: /you've been invited/i })
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Oakview E2E Residency")).toBeVisible();
  await expect(page.getByText("Unit 101")).toBeVisible();

  // Not signed in yet — accepting routes through sign-in first.
  await page.getByRole("button", { name: /accept invite/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByRole("button", { name: /continue as tenant/i }).click();
  await page.waitForURL("**/tenant/dashboard", { timeout: 30_000 });

  await expect(page.getByText("Unit 101")).toBeVisible({ timeout: 15_000 });
});
