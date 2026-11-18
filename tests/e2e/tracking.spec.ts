import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page, email = unique()) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Tracker User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function giveConsent(page: Page) {
  await page.goto("/assessment");
  await page.getByLabel(/Required: I agree/).check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await expect(page.getByLabel(/Age range/)).toBeVisible();
}

async function startDemo(page: Page) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /Try the demo/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("lifestyle tracker", () => {
  test("needs sign-in, and asks for health consent before saving", async ({ page }) => {
    await page.goto("/tracker");
    await expect(page).toHaveURL(/\/sign-in/);
    await signUp(page);
    await page.goto("/tracker");
    await expect(page.getByTestId("tracker-needs-consent")).toBeVisible();
    await page.getByLabel(/Sleep last night/).fill("7");
    await page.getByRole("button", { name: "Save this day" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("health consent");
  });

  test("add, edit and delete a daily entry", async ({ page }) => {
    await signUp(page);
    await giveConsent(page);
    await page.goto("/tracker");

    // An empty form is refused, not saved as zeros.
    await page.getByRole("button", { name: "Save this day" }).click();
    await expect(page.locator("p[role='alert']").first()).toBeVisible();

    await page.getByLabel(/Sleep last night/).fill("7");
    await page.getByLabel(/Stress today/).fill("3");
    await page.getByRole("button", { name: "Save this day" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    const recent = page.getByTestId("recent-entries");
    await expect(recent).toContainText("7");

    // Edit: open the same day again and change a value.
    await page.getByRole("link", { name: /^Edit / }).first().click();
    await expect(page.getByRole("button", { name: "Save changes to this day" })).toBeVisible();
    await page.getByLabel(/Sleep last night/).fill("8.5");
    await page.getByRole("button", { name: "Save changes to this day" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await expect(page.getByTestId("recent-entries")).toContainText("8.5");

    await page.getByRole("button", { name: /^Delete / }).first().click();
    await expect(page.getByTestId("recent-entries")).not.toContainText("8.5");
  });

  test("demo user sees calendar, charts, summaries and a period comparison without good or bad wording", async ({ page }) => {
    await startDemo(page);
    await page.goto("/tracker");
    await expect(page.getByTestId("calendar")).toBeVisible();
    await expect(page.getByTestId("trend-chart")).toBeVisible();
    await expect(page.getByTestId("weekly-summary")).toBeVisible();
    await expect(page.getByTestId("monthly-summary")).toBeVisible();
    await expect(page.getByTestId("period-compare")).toBeVisible();
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\b(improved|worsened|better|worse)\b/i);
  });

  test("gentle mode hides the charts but keeps the form", async ({ page }) => {
    await startDemo(page);
    await page.goto("/settings");
    await page.getByLabel("Turn on gentle mode").check();
    await page.getByRole("button", { name: "Save gentle mode setting" }).click();
    await expect(page.getByText("Gentle mode is on.")).toBeVisible();
    await page.goto("/tracker");
    await expect(page.getByTestId("gentle-hidden").first()).toBeVisible();
    await expect(page.getByTestId("trend-chart")).toHaveCount(0);
    await expect(page.getByTestId("habit-form")).toBeVisible();
  });
});

test.describe("medical reports", () => {
  test("add and delete a lab value, with the professional-interpretation warning", async ({ page }) => {
    await signUp(page);
    await giveConsent(page);
    await page.goto("/reports");
    await expect(page.getByTestId("report-warning")).toContainText("professional");

    await page.getByLabel("What was measured").selectOption("fsh");
    await page.getByLabel("Value from your report").fill("6");
    await page.getByRole("button", { name: "Save this value" }).click();
    await expect(page.getByRole("status").filter({ hasText: /saved/i })).toBeVisible();
    await expect(page.locator("main")).toContainText("IU/L");
    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/\b(normal range for you|low sperm count|within normal)\b/i);

    await page.getByRole("button", { name: /^Delete .*FSH/i }).first().click();
    await expect(page.getByRole("button", { name: /^Delete .*FSH/i })).toHaveCount(0);
  });

  test("a reversed lab range is refused", async ({ page }) => {
    await signUp(page);
    await giveConsent(page);
    await page.goto("/reports");
    await page.getByLabel("Value from your report").fill("6");
    await page.getByLabel("Your lab's range, lower end").fill("10");
    await page.getByLabel("Your lab's range, upper end").fill("2");
    await page.getByRole("button", { name: "Save this value" }).click();
    await expect(page.getByText(/upper end must not be lower/i)).toBeVisible();
  });
});

test.describe("ownership", () => {
  test("another user never sees someone else's entries or lab values", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const a = await ctxA.newPage();
    await signUp(a);
    await giveConsent(a);
    await a.goto("/tracker");
    await a.getByLabel(/Sleep last night/).fill("6.25");
    await a.getByRole("button", { name: "Save this day" }).click();
    await expect(a.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await a.goto("/reports");
    await a.getByLabel("Value from your report").fill("123.4");
    await a.getByRole("button", { name: "Save this value" }).click();
    await expect(a.getByRole("status").filter({ hasText: /saved/i })).toBeVisible();

    const ctxB = await browser.newContext();
    const b = await ctxB.newPage();
    await signUp(b);
    await b.goto("/tracker");
    await expect(b.getByTestId("recent-entries")).not.toContainText("6.25");
    await b.goto("/reports");
    await expect(b.locator("main")).not.toContainText("123.4");
    const exp = await (await b.request.post("/api/privacy/export", { form: { format: "json" } })).json();
    expect(exp.dailyEntries).toHaveLength(0);
    expect(exp.labValues).toHaveLength(0);
    await ctxA.close();
    await ctxB.close();
  });
});

test.describe("AI Fertility Intelligence", () => {
  test("rules-based observations are shown with all six parts and sources", async ({ page }) => {
    await startDemo(page);
    await page.goto("/intelligence");
    const cards = page.getByTestId("pattern-insight");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(2);
    const first = cards.first();
    for (const part of ["Your data", "What this means in general", "Practical ideas", "Limits:", "When to talk to a professional:", "Sources:"]) {
      await expect(first).toContainText(part);
    }
  });

  test("without AI consent nothing is sent and the summary is built by rules", async ({ page }) => {
    await startDemo(page);
    await page.goto("/intelligence");
    await page.getByRole("button", { name: "Create summary" }).click();
    const result = page.getByTestId("intelligence-result");
    await expect(result).toBeVisible();
    await expect(result).toHaveAttribute("data-mode", "rules");
    await expect(page.getByTestId("receipt-nothing-sent")).toBeVisible();
    await expect(result).toContainText("Questions you could ask");
  });

  test("the AI tracking-data consent is separate and can be given and withdrawn", async ({ page }) => {
    await startDemo(page);
    await page.goto("/privacy");
    await expect(page.getByTestId("ai-tracking-explain")).toBeVisible();
    await page.getByRole("button", { name: "Allow AI to read my tracking summary" }).click();
    await expect(page.getByRole("button", { name: "Withdraw AI tracking-data consent" })).toBeVisible();
    // The AI service is switched off on the test server, so even with consent nothing is sent.
    await page.goto("/intelligence");
    await page.getByRole("button", { name: /Create (AI )?summary/ }).click();
    await expect(page.getByTestId("intelligence-result")).toHaveAttribute("data-mode", "rules");
    await expect(page.getByTestId("receipt-nothing-sent")).toBeVisible();
    await page.goto("/privacy");
    await page.getByRole("button", { name: "Withdraw AI tracking-data consent" }).click();
    await expect(page.getByRole("button", { name: "Allow AI to read my tracking summary" })).toBeVisible();
  });
});

test.describe("weekly goals", () => {
  test("add a goal, count days, and remove it", async ({ page }) => {
    await signUp(page);
    await giveConsent(page);
    await page.goto("/coach");
    await page.getByTestId("goal-suggestions").getByRole("button", { name: "Add" }).first().click();
    const item = page.getByTestId("goal-item").first();
    await expect(item).toContainText("0 of 3 days");
    await item.getByRole("button", { name: /Done today/ }).click();
    await expect(page.getByTestId("goal-item").first()).toContainText("1 of 3 days");
    await page.getByTestId("goal-item").first().getByRole("button", { name: "Undo (-1)" }).click();
    await expect(page.getByTestId("goal-item").first()).toContainText("0 of 3 days");
    await page.getByTestId("goal-item").first().getByRole("button", { name: "Remove" }).click();
    await expect(page.getByTestId("no-goals")).toBeVisible();
  });
});

test.describe("consultation preparation", () => {
  test("includes habits, changes and labs, and the person can leave sections out", async ({ page }) => {
    await startDemo(page);
    await page.goto("/summary");
    await expect(page.getByTestId("summary-habits")).toBeVisible();
    await expect(page.getByTestId("summary-changes")).toBeVisible();
    await expect(page.getByTestId("summary-labs")).toContainText("Typed by the patient");

    await page.getByLabel("Lab values I recorded").uncheck();
    await page.getByLabel("Daily habit summary (last 30 days)").uncheck();
    await page.getByRole("button", { name: "Update preview" }).click();
    await expect(page.getByTestId("summary-labs")).toHaveCount(0);
    await expect(page.getByTestId("summary-habits")).toHaveCount(0);
    await expect(page.getByTestId("summary-changes")).toBeVisible();
  });
});

test.describe("privacy coverage of tracking data", () => {
  test("export includes tracking data, and deleting removes it", async ({ page }) => {
    await startDemo(page);
    const before = await (await page.request.post("/api/privacy/export", { form: { format: "json" } })).json();
    expect(before.dailyEntries.length).toBeGreaterThan(10);
    expect(before.labValues.length).toBeGreaterThan(3);

    await page.goto("/privacy");
    await page.getByLabel(/Type DELETE to confirm/).first().fill("DELETE");
    await page.getByRole("button", { name: "Delete my assessment data" }).click();
    await expect(page.getByRole("status").filter({ hasText: /Deleted/ })).toBeVisible();

    const after = await (await page.request.post("/api/privacy/export", { form: { format: "json" } })).json();
    expect(after.dailyEntries).toHaveLength(0);
    expect(after.labValues).toHaveLength(0);
    expect(after.weeklyGoals).toHaveLength(0);
  });
});
