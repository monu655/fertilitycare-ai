import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 400, height: 800 } });

test.describe("mobile menu closes after a tap", () => {
  test("app menu closes after choosing a page, and with Escape", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /Try the demo/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    const details = page.locator("header details");
    await page.getByLabel("Open navigation").click();
    await expect(details).toHaveAttribute("open", "");
    await page.getByRole("link", { name: "Ask a Question" }).last().click();
    await expect(page).toHaveURL(/\/ask/);
    await expect(details).not.toHaveAttribute("open", "");

    await page.getByLabel("Open navigation").click();
    await expect(details).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("website menu closes after tapping a link", async ({ page }) => {
    await page.goto("/");
    const details = page.locator("header details");
    await page.getByLabel("Open menu").click();
    await expect(details).toHaveAttribute("open", "");
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Health Resources" }).click();
    await expect(page).toHaveURL(/\/resources/);
    await expect(page.locator("header details[open]")).toHaveCount(0);

    await page.goto("/");
    await page.getByLabel("Open menu").click();
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "How It Works" }).click();
    await expect(page.locator("header details[open]")).toHaveCount(0);
  });
});
