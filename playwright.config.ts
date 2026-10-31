import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

// End-to-end tests use a SEPARATE database so your dev data is never touched.
const devUrl = process.env.DATABASE_URL ?? "";
const testDbUrl = process.env.E2E_DATABASE_URL ?? devUrl.replace(/\/[^/]*$/, "/fertilitycare_test");

// If you already have Chrome installed, set PLAYWRIGHT_CHROME_PATH to use it.
// Otherwise run `npx playwright install chromium` once.
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: chromePath } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], launchOptions: { executablePath: chromePath } },
    },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: testDbUrl,
      AUTH_URL: "http://localhost:3100",
      AUTH_TRUST_HOST: "true",
      SIGNUP_LIMIT_PER_HOUR: "1000",
    },
  },
});
