import { test, expect } from "@playwright/test";

test.describe("Public Wedding Website", () => {
  test("should load the public wedding website by subUrl", async ({
    page,
  }) => {
    // Seed website subUrl is "shrek-fiona"
    await page.goto("/shrek-fiona");

    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
    // Should show the wedding couple's info
    const body = page.locator("body");
    await expect(body).toContainText(/shrek|fiona/i);
  });

  test("should display wedding events on public site", async ({ page }) => {
    await page.goto("/shrek-fiona");

    const body = page.locator("body");
    // Public site should show event details
    await expect(body).toContainText(/ceremony|feast|breakfast/i);
  });

  test("should load the RSVP page", async ({ page }) => {
    await page.goto("/shrek-fiona/rsvp");

    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
  });

  test("should return 404 for non-existent wedding website", async ({
    page,
  }) => {
    await page.goto("/non-existent-wedding-url");

    // The app renders a custom "not found" page with "We can't find this page"
    const body = page.locator("body");
    await expect(body).toContainText(/can't find this page/i);
  });
});

test.describe("Guest Self-Fill Registration", () => {
  test("should load the self-fill join page with valid token", async ({
    page,
  }) => {
    // Seed selfFillToken is "swamp-join-portal"
    await page.goto("/join/swamp-join-portal");

    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
  });
});

test.describe("Landing Page", () => {
  test("should load the home page without errors", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
    // Page should render the OSWP branding
    const body = page.locator("body");
    await expect(body).toContainText("OSWP");
  });
});
