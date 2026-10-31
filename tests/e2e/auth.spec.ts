import { expect, test } from "@playwright/test";

// Unique email per run so tests never collide with old rows in the test database.
const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const password = "Test-password-123";

test.describe("authentication", () => {
  test("visitor is redirected to sign-in when opening a private page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-up shows server-side validation errors for a weak password", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email address").fill("weak@example.com");
    await page.getByLabel("Password (required)", { exact: true }).fill("short");
    await page.getByLabel("Confirm password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("alert").first()).toContainText("at least 10 characters");
  });

  test("user can sign up, sign out, reject a wrong password, then sign in", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password (required)", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Welcome, Test User/ })).toBeVisible();

    // Sign out (mobile uses the menu, desktop uses the sidebar button)
    const menu = page.getByRole("group").locator("summary");
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL("/");

    await page.goto("/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill("Wrong-password-999");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Next.js has its own hidden role="alert" route announcer, so target our message only.
    await expect(page.locator("p[role='alert']")).toContainText("incorrect");

    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
