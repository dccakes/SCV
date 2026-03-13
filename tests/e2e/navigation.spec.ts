import { test, expect } from "@playwright/test";

test.describe("Authenticated Navigation", () => {
  test("should navigate between all main sections", async ({ page }) => {
    // Start at dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");

    // Navigate to guest list
    await page.getByRole("link", { name: /guest/i }).first().click();
    await page.waitForURL("/guest-list");
    await expect(page).toHaveURL("/guest-list");

    // Navigate to events
    await page.getByRole("link", { name: /event/i }).first().click();
    await page.waitForURL("/events");
    await expect(page).toHaveURL("/events");

    // Navigate to vendors
    await page.getByRole("link", { name: /vendor/i }).first().click();
    await page.waitForURL("/vendors");
    await expect(page).toHaveURL("/vendors");

    // Navigate back to dashboard
    await page.getByRole("link", { name: /dashboard|overview/i }).first().click();
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("should maintain authentication across page navigations", async ({
    page,
  }) => {
    const pages = ["/dashboard", "/guest-list", "/events", "/vendors"];

    for (const path of pages) {
      await page.goto(path);
      await expect(page).toHaveURL(path);
      // Should not be redirected to home (which would mean auth was lost)
      await expect(page).not.toHaveURL("/");
    }
  });
});
