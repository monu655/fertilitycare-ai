import { expect, test } from "@playwright/test";

test.describe("demo account", () => {
  test("one click opens a demo account with synthetic insights", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /Try the demo/ }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Demo account: all data here is synthetic/)).toBeVisible();

    await page.goto("/insights");
    await expect(page.getByTestId("insight-card").first()).toBeVisible();
    // AI consent is off by default, so no AI card.
    await expect(page.getByTestId("ai-notes")).toHaveCount(0);
  });

  test("two visitors can start the demo at the same time", async ({ browser }) => {
    for (let i = 0; i < 2; i++) {
      const ctx = await browser.newContext({ baseURL: "http://localhost:3100" });
      const page = await ctx.newPage();
      await page.goto("/sign-in");
      await page.getByRole("button", { name: /Try the demo/ }).click();
      await expect(page).toHaveURL(/\/dashboard/);
      await ctx.close();
    }
  });
});
