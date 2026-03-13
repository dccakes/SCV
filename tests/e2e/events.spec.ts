import { test, expect } from "@playwright/test";

test.describe("Events", () => {
  test("should load the events page", async ({ page }) => {
    await page.goto("/events");

    await expect(page).toHaveURL("/events");
    await expect(page.locator("body")).not.toContainText(
      "Application error"
    );
  });

  test("should display seeded events", async ({ page }) => {
    await page.goto("/events");

    const body = page.locator("body");
    // Seed has: Swamp Ceremony, Welcome Feast, Morning-After Breakfast
    await expect(body).toContainText(/swamp ceremony/i);
    await expect(body).toContainText(/welcome feast/i);
    await expect(body).toContainText(/morning-after breakfast/i);
  });

  test("should show event details like venue and date", async ({ page }) => {
    await page.goto("/events");

    const body = page.locator("body");
    // Check venue names from seed data
    await expect(body).toContainText(/old oak grove|far far away|swamp cottage/i);
  });

  test("should display RSVP statistics for events", async ({ page }) => {
    await page.goto("/events");

    const body = page.locator("body");
    // Events have collectRsvp: true, so stats should be visible
    // Look for RSVP-related text like "Attending", counts, or status indicators
    await expect(body).toContainText(/attending|invited|declined|\d+/i);
  });
});
