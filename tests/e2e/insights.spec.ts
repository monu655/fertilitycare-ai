import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Insight User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function submitMinimalAssessment(page: Page) {
  await page.goto("/assessment");
  await page.getByLabel(/Required: I agree/).check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await page.getByLabel(/Age range/).selectOption("40-44");
  await page.getByLabel("Good", { exact: true }).check();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page).toHaveURL(/\/insights/);
}

test.describe("insights", () => {
  test("shows sourced insight cards with evidence links and limitations", async ({ page }) => {
    await signUp(page, unique());
    await submitMinimalAssessment(page);

    const cards = page.getByTestId("insight-card");
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().getByText("Limitations and uncertainty")).toBeVisible();
    await expect(cards.first().getByRole("link").first()).toHaveAttribute("href", /^https:\/\//);
    await expect(page.getByText("Educational Information").first()).toBeVisible();
    // The AI card must not appear without the separate AI consent and the server switch.
    await expect(page.getByTestId("ai-notes")).toHaveCount(0);
    // No diagnosis wording anywhere on the page.
    await expect(page.getByText(/you are infertile/i)).toHaveCount(0);
  });

  test("filter tabs narrow the list", async ({ page }) => {
    await signUp(page, unique());
    await submitMinimalAssessment(page);
    await page.goto("/insights?filter=professional");
    const kinds = await page.getByTestId("insight-card").count();
    await page.goto("/insights?filter=all");
    expect(await page.getByTestId("insight-card").count()).toBeGreaterThanOrEqual(kinds);
  });
});

test.describe("care navigation and resources", () => {
  test("care page needs sign-in and shows the urgent-care section", async ({ page }) => {
    await page.goto("/care");
    await expect(page).toHaveURL(/\/sign-in/);
    await signUp(page, unique());
    await page.goto("/care");
    await expect(page.getByRole("heading", { name: "Seek urgent care now if this happens" })).toBeVisible();
    await expect(page.getByText("emergency department").first()).toBeVisible();
  });

  test("signed-in users see resources inside the app, without the website menu", async ({ page, isMobile }) => {
    await signUp(page, unique());
    await page.goto("/resources");
    await expect(page.getByRole("heading", { name: "Health resources" })).toBeVisible();
    await expect(page.getByRole("link", { name: "How It Works" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Get Started" })).toHaveCount(0);
    if (!isMobile) await expect(page.locator("aside").getByRole("link", { name: "Privacy Center" })).toBeVisible();
  });

  test("resources page is public and search works", async ({ page }) => {
    await page.goto("/resources");
    const all = await page.getByTestId("resource").count();
    expect(all).toBeGreaterThan(3);

    await page.getByLabel("Search").fill("semen analysis");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/q=semen/);
    const some = await page.getByTestId("resource").count();
    expect(some).toBeGreaterThan(0);
    expect(some).toBeLessThan(all);

    // Signed-out visitors still get the website header.
    await expect(page.getByRole("link", { name: "How It Works" }).first()).toBeVisible();

    await page.goto("/resources?q=zzzzzz-no-match");
    await expect(page.getByText("Nothing matched.")).toBeVisible();
  });
});
