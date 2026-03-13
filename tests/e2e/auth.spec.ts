import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show sign-in page with email and password fields", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    // Should stay on sign-in page and not redirect to dashboard
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL("/dashboard");
  });

  test("should sign in with valid seed credentials and reach dashboard", async ({
    page,
  }) => {
    await page.goto("/auth/sign-in");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Email").fill("shrek@swamp.wed");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Login" }).click();

    await page.waitForURL("/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL("/dashboard");
  });

  test("should redirect unauthenticated users from protected routes", async ({
    browser,
  }) => {
    // Use a fresh context with explicitly empty storage state (no cookies/auth)
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
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
    await page.waitForLoadState("networkidle");

    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
