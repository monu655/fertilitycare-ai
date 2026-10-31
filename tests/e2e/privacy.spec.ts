import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page, email: string, name = "Privacy User") {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function submitAssessment(page: Page) {
  await page.goto("/assessment");
  await page.getByLabel(/Required: I agree/).check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await page.getByLabel(/Age range/).selectOption("40-44");
  await page.getByLabel("Good", { exact: true }).check();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page).toHaveURL(/\/insights/);
}

test.describe("settings", () => {
  test("name change works and password change needs the current password", async ({ page }) => {
    const email = unique();
    await signUp(page, email);
    await page.goto("/settings");

    await page.getByLabel("Name").fill("Renamed Person");
    await page.getByRole("button", { name: "Save name" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Name saved." })).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome, Renamed Person/ })).toBeVisible();

    await page.goto("/settings");
    await page.getByLabel(/^Current password/).fill("Wrong-password-999");
    await page.getByLabel(/^New password/).fill("Another-password-9");
    await page.getByLabel(/^Confirm new password/).fill("Another-password-9");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("not correct");

    // After an error React clears the form, so every field is filled again.
    await page.getByLabel(/^Current password/).fill(password);
    await page.getByLabel(/^New password/).fill("Another-password-9");
    await page.getByLabel(/^Confirm new password/).fill("Another-password-9");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Password changed." })).toBeVisible();

    // The new password works for a fresh sign-in, the old one does not.
    await page.context().clearCookies();
    await page.goto("/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("p[role='alert']")).toContainText("incorrect");
    await page.getByLabel("Password").fill("Another-password-9");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("privacy center", () => {
  test("AI consent needs health consent, then can be turned on and off", async ({ page }) => {
    await signUp(page, unique());
    await page.goto("/privacy");
    await page.getByRole("button", { name: "Allow AI notes" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("health-assessment consent first");

    await submitAssessment(page);
    await page.goto("/privacy");
    await page.getByRole("button", { name: "Allow AI notes" }).click();
    await expect(page.getByRole("status").filter({ hasText: "consent saved" })).toBeVisible();
    await page.getByRole("button", { name: "Withdraw AI notes consent" }).click();
    await expect(page.getByRole("status").filter({ hasText: "withdrawn" })).toBeVisible();
  });

  test("withdrawing consent blocks new answers but keeps stored data until deleted", async ({ page }) => {
    await signUp(page, unique());
    await submitAssessment(page);
    await page.goto("/privacy");
    await page.getByRole("button", { name: "Withdraw health consent" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Consent withdrawn" })).toBeVisible();

    const res = await page.request.post("/api/privacy/export", { form: { format: "json" } });
    const data = await res.json();
    expect(data.assessments).toHaveLength(1);
    expect(data.consents.at(-1).granted).toBe(false);
  });

  test("export contains the user's own data and no password hash, and needs sign-in", async ({ page, playwright, baseURL }) => {
    const email = unique();
    await signUp(page, email);
    await submitAssessment(page);

    const res = await page.request.post("/api/privacy/export", { form: { format: "json" } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-disposition"]).toContain("attachment");
    const text = await res.text();
    expect(text).not.toMatch(/password/i);
    expect(res.headers()["content-disposition"]).toContain(".json");
    const data = JSON.parse(text);
    expect(data.account.email).toBe(email);
    expect(data.assessments[0].answers.context.ageRange).toBe("40-44");

    // The default download is a readable text file with plain sentences and no password.
    const textRes = await page.request.post("/api/privacy/export", { form: { format: "text" } });
    expect(textRes.headers()["content-disposition"]).toContain(".txt");
    const readable = await textRes.text();
    expect(readable).toContain("FERTILITYCARE AI - YOUR DATA");
    expect(readable).toContain(email);
    expect(readable).toContain("40 to 44");
    expect(readable).not.toMatch(/password_hash|passwordHash|\{\s*"/);

    // A request without a session is refused.
    const anon = await playwright.request.newContext({ baseURL });
    expect((await anon.post("/api/privacy/export")).status()).toBe(401);
    await anon.dispose();
  });

  test("deleting assessment data needs DELETE and removes everything", async ({ page }) => {
    await signUp(page, unique());
    await submitAssessment(page);
    await page.goto("/privacy");

    await page.getByLabel(/Type DELETE to confirm/).first().fill("delete");
    await page.getByRole("button", { name: "Delete my assessment data" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("DELETE");

    await page.getByLabel(/Type DELETE to confirm/).first().fill("DELETE");
    await page.getByRole("button", { name: "Delete my assessment data" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Deleted 1 assessment" })).toBeVisible();

    const data = await (await page.request.post("/api/privacy/export", { form: { format: "json" } })).json();
    expect(data.assessments).toHaveLength(0);
    expect(data.insights).toHaveLength(0);
  });

  test("deleting the account needs the password, signs out, and the login stops working", async ({ page }) => {
    const email = unique();
    await signUp(page, email);
    await submitAssessment(page);
    await page.goto("/privacy");

    await page.getByLabel("Your password").fill("Wrong-password-999");
    await page.getByLabel(/Type DELETE to confirm/).last().fill("DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("not correct");

    await page.getByLabel("Your password").fill(password);
    await page.getByLabel(/Type DELETE to confirm/).last().fill("DELETE");
    await page.getByRole("button", { name: "Delete my account" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("p[role='alert']")).toContainText("incorrect");
  });
});

test.describe("consultation summary", () => {
  test("without consent it points to the Privacy Center", async ({ page }) => {
    await signUp(page, unique());
    await page.goto("/summary");
    await expect(page.getByText("health consent is currently not given")).toBeVisible();
  });

  test("with consent but no submitted assessment it asks for an assessment first", async ({ page }) => {
    await signUp(page, unique());
    await page.goto("/assessment");
    await page.getByLabel(/Required: I agree/).check();
    await page.getByRole("button", { name: "Agree and continue" }).click();
    await expect(page.getByRole("heading", { name: "Basic health context" })).toBeVisible(); // consent is saved now
    await page.goto("/summary");
    await expect(page.getByText("Submit your health assessment first.")).toBeVisible();
  });

  test("shows a preview, saves own questions, hides unticked sections, and gates printing", async ({ page }) => {
    await signUp(page, unique());
    await submitAssessment(page);
    await page.goto("/summary");

    const preview = page.getByTestId("summary-preview");
    await expect(preview).toContainText("not a diagnosis");
    await expect(preview).toContainText("40 to 44");

    await page.getByLabel(/Your own questions/).fill("Is my sleep a concern?");
    await page.getByRole("button", { name: "Save questions" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Questions saved." })).toBeVisible();
    await page.reload();
    await expect(preview).toContainText("Is my sleep a concern?");

    // Untick "Health context" and update the preview.
    await page.getByLabel("Health context").uncheck();
    await page.getByRole("button", { name: "Update preview" }).click();
    await expect(preview).not.toContainText("40 to 44");

    // Too many questions are rejected by the server.
    await page.getByLabel(/Your own questions/).fill("1\n2\n3\n4\n5\n6");
    await page.getByRole("button", { name: "Save questions" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("at most 5");

    // Print stays disabled until the person confirms.
    const print = page.getByRole("button", { name: /Print or save as PDF/ });
    await expect(print).toBeDisabled();
    await page.getByLabel(/I understand this summary contains/).check();
    await expect(print).toBeEnabled();
  });
});
