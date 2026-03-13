import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show sign-in page with email and password fields", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should stay on sign-in page and not redirect to dashboard
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL("/dashboard");
  });

  test("should sign in with valid seed credentials and reach dashboard", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");

    await page.getByLabel(/email/i).fill("shrek@swamp.wed");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL("/dashboard");
  });

  test("should redirect unauthenticated users from protected routes", async ({
    browser,
  }) => {
    // Use a fresh context with no stored auth
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/dashboard");
    // Middleware should redirect to home
    await expect(page).toHaveURL("/");

    await page.goto("/guest-list");
    await expect(page).toHaveURL("/");

    await page.goto("/events");
    await expect(page).toHaveURL("/");

    await page.goto("/vendors");
    await expect(page).toHaveURL("/");

    await context.close();
  });

  test("should show sign-up page", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await expect(page.getByLabel(/name/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });
});
