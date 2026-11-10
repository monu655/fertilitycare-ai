import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Trust User");
  await page.getByLabel("Email address").fill(unique());
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("how we test safety", () => {
  test("is public, shows live results with no failures, and lists known gaps openly", async ({ page }) => {
    await page.goto("/how-we-test");
    await expect(page.getByRole("heading", { name: "How we test safety" })).toBeVisible();
    // Signed-out visitors get the website header.
    await expect(page.getByRole("link", { name: "How It Works" }).first()).toBeVisible();

    await expect(page.getByTestId("guardrail-summary")).toContainText(/(\d+) of \1 checks passed/);
    expect(await page.getByTestId("guardrail-row").count()).toBeGreaterThan(30);
    await expect(page.locator('[data-testid="guardrail-row"][data-passed="false"]')).toHaveCount(0);

    await expect(page.getByTestId("known-gaps")).toBeVisible();
    await expect(page.getByText(/does not test the AI model itself/)).toBeVisible();
  });

  test("signed-in users see it inside the app, linked from the Ask page", async ({ page }) => {
    await signUp(page);
    await page.goto("/ask");
    await page.getByRole("link", { name: "How we test safety" }).click();
    await expect(page).toHaveURL(/\/how-we-test/);
    await expect(page.getByRole("link", { name: "How It Works" })).toHaveCount(0);
  });
});

test.describe("account activity", () => {
  test("needs sign-in", async ({ page }) => {
    await page.goto("/privacy/activity");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("lists what happened in plain words, newest first, with no health content", async ({ page }) => {
    await signUp(page);
    await page.goto("/privacy");
    await page.getByRole("link", { name: "See all activity" }).click();
    await expect(page).toHaveURL(/\/privacy\/activity/);

    const table = page.getByTestId("activity-table");
    await expect(table.getByText("Account created")).toBeVisible();
    await expect(page.getByText(/No health answers, questions or test values/)).toBeVisible();
  });

  test("records a sign-in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /Try the demo/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/privacy/activity");
    const table = page.getByTestId("activity-table");
    await expect(table.getByText("Demo account started")).toBeVisible();
    await expect(table.getByText("Signed in")).toBeVisible();
  });
});
