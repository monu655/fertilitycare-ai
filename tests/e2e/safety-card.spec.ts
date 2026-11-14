import { expect, test } from "@playwright/test";

test.describe("safety card and forgot password", () => {
  test("safety card is public, shows live test numbers, limits and the AI status", async ({ page }) => {
    await page.goto("/safety-card");
    await expect(page.getByRole("heading", { name: "Safety card" })).toBeVisible();
    await expect(page.getByTestId("card-live-count")).toContainText(/(\d+) of \1 safety cases pass right now/);
    await expect(page.getByTestId("card-not")).toContainText("does not diagnose");
    await expect(page.getByTestId("card-limits")).toContainText("No doctor has reviewed");
    await expect(page.getByTestId("card-limits")).toContainText("No compliance");
    await expect(page.getByTestId("ai-status")).toContainText(/AI on this server right now/);
    await page.getByTestId("card-live-count").getByRole("link", { name: "See every case" }).click();
    await expect(page).toHaveURL(/\/how-we-test/);
  });

  test("footer links to the safety card", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Safety card" }).first().click();
    await expect(page).toHaveURL(/\/safety-card/);
  });

  test("forgot password link opens an honest page instead of a 404", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByTestId("forgot-password-note")).toContainText("does not send emails");
    await page.getByRole("link", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("privacy policy no longer says export and deletion are missing", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page.getByText("not built yet")).toHaveCount(0);
    await expect(page.getByText(/download your data/)).toBeVisible();
  });
});
