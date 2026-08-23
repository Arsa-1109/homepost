import { defineConfig } from "@playwright/test";

/**
 * C4 — Playwright smoke harness.
 *
 * Runs `next start` with MOCK_AUTH=true so @clerk/nextjs resolves to the
 * offline mock (src/lib/clerk-mock.tsx) and a stub API serves canned JSON.
 * Chromium-only, headless, per the remediation plan's initial scope.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    headless: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      port: 8000,
      reuseExistingServer: false,
    },
    {
      command: "npm run build:e2e && npm run start:e2e",
      port: 3100,
      timeout: 420_000,
      reuseExistingServer: false,
      env: {
        MOCK_AUTH: "true",
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
