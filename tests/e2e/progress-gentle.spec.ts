import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Progress User");
  await page.getByLabel("Email address").fill(unique());
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function startDemo(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /Try the demo/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("transparency on the Ask page", () => {
  test("says nothing was sent to any AI service when AI is off", async ({ page }) => {
    await signUp(page);
    await page.goto("/ask");
    await page.getByLabel(/Your question/).fill("Does smoking affect sperm?");
    await page.getByRole("button", { name: "Ask" }).click();
    const receipt = page.getByTestId("data-receipt");
    await expect(receipt).toBeVisible();
    await receipt.getByText("What was sent to an AI service").click();
    await expect(receipt).toContainText("Nothing was sent to any AI service");
    // No AI reply, so no safety-check list.
    await expect(page.getByTestId("safety-checks")).toHaveCount(0);
  });
});

test.describe("progress page", () => {
  test("needs sign-in, and asks for an assessment first", async ({ page }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/\/sign-in/);
    await signUp(page);
    await page.goto("/progress");
    await expect(page.getByText("Submit your health assessment first")).toBeVisible();
  });

  test("demo user sees answers side by side and charts of typed numbers, with no judgement", async ({ page }) => {
    await startDemo(page);
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: "My progress" })).toBeVisible();

    const table = page.getByTestId("lifestyle-table");
    await expect(table.locator("thead th")).toHaveCount(4); // question + 3 dates
    await expect(table.getByText("Changed").first()).toBeVisible();

    await expect(page.getByTestId("lab-chart")).toHaveCount(2);
    await expect(page.getByText(/does not say whether a change is good or bad/)).toBeVisible();
    await expect(page.getByText(/improved|worse|abnormal|normal range:/i)).toHaveCount(0);
  });

  test("can start a new assessment from the progress page", async ({ page }) => {
    await startDemo(page);
    await page.goto("/progress");
    await page.getByRole("button", { name: "Start a new assessment" }).click();
    await expect(page).toHaveURL(/\/assessment/);
  });
});

test.describe("gentle mode", () => {
  test("hides own numbers on Insights and Progress, keeps safety info, and can be turned off", async ({ page }) => {
    await startDemo(page);

    await page.goto("/insights");
    await expect(page.getByText("What you reported").first()).toBeVisible();

    await page.goto("/settings");
    await page.getByLabel("Turn on gentle mode").check();
    await page.getByRole("button", { name: "Save gentle mode setting" }).click();
    await expect(page.getByText("Gentle mode is on.")).toBeVisible();

    await page.goto("/insights");
    await expect(page.getByTestId("gentle-note")).toBeVisible();
    await expect(page.getByText("What you reported")).toHaveCount(0);
    // Safety and source information stays.
    await expect(page.getByText("Limitations and uncertainty").first()).toBeVisible();
    await expect(page.getByTestId("insight-card").first().getByRole("link").first()).toHaveAttribute("href", /^https:\/\//);

    await page.goto("/progress");
    await expect(page.getByTestId("gentle-hidden")).toBeVisible();
    await expect(page.getByTestId("lab-chart")).toHaveCount(0);

    await page.goto("/settings");
    await page.getByLabel("Turn on gentle mode").uncheck();
    await page.getByRole("button", { name: "Save gentle mode setting" }).click();
    await expect(page.getByText("Gentle mode is off.")).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByTestId("lab-chart")).toHaveCount(2);
  });
});
