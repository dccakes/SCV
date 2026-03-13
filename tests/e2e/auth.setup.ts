import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "tests/e2e/.auth/user.json";

setup("authenticate as seed user", async ({ page }) => {
  // Navigate to sign-in page
  await page.goto("/auth/sign-in");

  // Fill in credentials from the seed fixture (shrek@swamp.wed / password123)
  await page.getByLabel(/email/i).fill("shrek@swamp.wed");
  await page.getByLabel(/password/i).fill("password123");

  // Submit the form
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard after successful login
  await page.waitForURL("/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL("/dashboard");

  // Save signed-in state for reuse across tests
  await page.context().storageState({ path: AUTH_FILE });
});
