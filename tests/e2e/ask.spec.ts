import { expect, test, type Page } from "@playwright/test";

const password = "Test-password-123";
const unique = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

async function signUp(page: Page) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Ask User");
  await page.getByLabel("Email address").fill(unique());
  await page.getByLabel("Password (required)", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("ask a question", () => {
  test("needs sign-in", async ({ page }) => {
    await page.goto("/ask");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("answers from the sources with links, when AI is off", async ({ page }) => {
    await signUp(page);
    await page.goto("/ask");
    await expect(page.getByText("Sources only").first()).toBeVisible();

    await page.getByLabel(/Your question/).fill("Does smoking affect sperm?");
    await page.getByRole("button", { name: "Ask" }).click();
    const result = page.getByTestId("ask-result");
    await expect(result).toHaveAttribute("data-kind", "answer");
    await expect(result).toContainText("Answered from sources only");
    await expect(result.getByRole("link").first()).toHaveAttribute("href", /^https:\/\//);
  });

  test("example link fills the question box", async ({ page }) => {
    await signUp(page);
    await page.goto("/ask");
    await page.getByRole("link", { name: "What is a semen analysis?" }).click();
    await expect(page.getByLabel(/Your question/)).toHaveValue("What is a semen analysis?");
  });

  test("shows urgent guidance, refuses diagnosis, and says when nothing is found", async ({ page }) => {
    await signUp(page);
    await page.goto("/ask");
    const box = page.getByLabel(/Your question/);
    const result = page.getByTestId("ask-result");

    await box.fill("I have sudden severe pain in my testicle");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(result).toHaveAttribute("data-kind", "urgent");
    await expect(result).toContainText("emergency department");

    await box.fill("Am I infertile?");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(result).toHaveAttribute("data-kind", "refused");

    await box.fill("what is the best pizza recipe");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(result).toHaveAttribute("data-kind", "no_answer");
    await expect(result).toContainText("will not guess");
  });

  test("a very short question is rejected by the server", async ({ page }) => {
    await signUp(page);
    await page.goto("/ask");
    await page.getByLabel(/Your question/).fill("hi");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(page.locator("p[role='alert']").first()).toContainText("at least 5");
  });
});
