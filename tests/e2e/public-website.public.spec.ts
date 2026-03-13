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
    const response = await page.goto("/non-existent-wedding-url");

    // Should be a 404 or show "not found" content
    const status = response?.status();
    const body = page.locator("body");

    if (status === 404) {
      expect(status).toBe(404);
    } else {
      // Next.js may render a not-found page with 200 status
      await expect(body).toContainText(/not found|404|does not exist/i);
    }
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
  test("should load the home page for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
    // Landing page should have sign-in / get started links
    const body = page.locator("body");
    await expect(body).toContainText(/sign in|get started|wedding/i);
  });
});
