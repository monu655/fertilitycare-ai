import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("assessment", () => {
  test("consent is required and the server blocks skipping ahead", async ({ page }) => {
    await signUp(page, "Consent User", unique());

    // Trying to open step 3 without consent still shows the consent step.
    await page.goto("/assessment?step=3");
    await expect(page.getByRole("heading", { name: "Introduction and consent" })).toBeVisible();

    // Submitting without ticking the box shows an error and stays on step 1.
    await page.getByRole("button", { name: "Agree and continue" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("agree");
    await expect(page.getByRole("heading", { name: "Introduction and consent" })).toBeVisible();

    // With consent, step 2 opens.
    await page.getByLabel(/Required: I agree/).check();
    await page.getByRole("button", { name: "Agree and continue" }).click();
    await expect(page.getByRole("heading", { name: "Basic health context" })).toBeVisible();
  });

  test("age range is validated on the server, progress is kept, and the full flow submits once", async ({ page }) => {
    await signUp(page, "Flow User", unique());
    await page.goto("/assessment");
    await page.getByLabel(/Required: I agree/).check();
    await page.getByRole("button", { name: "Agree and continue" }).click();

    // Step 2: leaving the required age range empty shows an error.
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("Choose one");

    await page.getByLabel(/Age range/).selectOption("30-34");
    await page.getByLabel("Good", { exact: true }).check();
    await page.getByRole("button", { name: "Save and continue" }).click();

    // Step 3 (lifestyle): skip everything.
    await expect(page.getByRole("heading", { name: "Lifestyle factors" })).toBeVisible();
    await page.getByRole("button", { name: "Save and continue" }).click();

    // Step 4: skip everything.
    await expect(page.getByRole("heading", { name: "Relevant medical history" })).toBeVisible();
    await page.getByRole("button", { name: "Save and continue" }).click();

    // Step 5: an out-of-range test value is rejected by the server.
    await expect(page.getByRole("heading", { name: "Existing tests" })).toBeVisible();
    await page.getByLabel(/Motility from your report/).fill("150");
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("at most 100");
    await page.getByLabel(/Motility from your report/).fill("55");
    await page.getByRole("button", { name: "Save and continue" }).click();

    // Resume: leave and come back, we land on the Review step with the saved answer shown.
    await page.goto("/dashboard");
    await expect(page.getByText("Continue assessment")).toBeVisible();
    await page.goto("/assessment");
    await expect(page.getByRole("heading", { name: "Review your answers" })).toBeVisible();
    await expect(page.getByText("30 to 34")).toBeVisible();
    await expect(page.getByText("55 percent")).toBeVisible();

    // Submit.
    await page.getByRole("button", { name: "Submit assessment" }).click();
    await expect(page).toHaveURL(/\/insights/);

    // A submitted assessment cannot be re-submitted or edited through the wizard.
    await page.goto("/assessment?step=6");
    await expect(page.getByText("Your assessment has been submitted.")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByText("Completed").first()).toBeVisible();
  });

  test("another user never sees someone else's assessment data", async ({ page, browser }) => {
    // User A answers and saves.
    await signUp(page, "User A", unique());
    await page.goto("/assessment");
    await page.getByLabel(/Required: I agree/).check();
    await page.getByRole("button", { name: "Agree and continue" }).click();
    await page.getByLabel(/Age range/).selectOption("45-49");
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page.getByRole("heading", { name: "Lifestyle factors" })).toBeVisible();

    // User B, in a separate browser session.
    const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
    const other = await ctx.newPage();
    await signUp(other, "User B", unique());
    await expect(other.getByText("Not started").first()).toBeVisible();
    await other.goto("/assessment?step=6");
    await expect(other.getByRole("heading", { name: "Introduction and consent" })).toBeVisible();
    await expect(other.getByText("45 to 49")).toHaveCount(0);
    await ctx.close();
  });
});
