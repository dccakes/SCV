import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("should load the dashboard page", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/dashboard");
    // Dashboard should render without errors
    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
  });

  test("should display wedding couple names", async ({ page }) => {
    await page.goto("/dashboard");

    // The seed data is for Shrek & Fiona's wedding
    await expect(page.locator("body")).toContainText(/shrek/i);
    await expect(page.locator("body")).toContainText(/fiona/i);
  });

  test("should display navigation links to other sections", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should have nav links to main sections
    await expect(
      page.getByRole("link", { name: /guest/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /event/i }).first()
    ).toBeVisible();
  });

  test("should show planning overview with event data", async ({ page }) => {
    await page.goto("/dashboard");

    // Seed has 3 events: Swamp Ceremony, Welcome Feast, Morning-After Breakfast
    // Dashboard should show event-related stats or names
    const body = page.locator("body");
    await expect(body).toContainText(/ceremony|feast|breakfast/i);
  });
});
