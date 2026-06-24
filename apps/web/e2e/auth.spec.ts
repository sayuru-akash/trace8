import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "E2E Test User",
  email: process.env.E2E_EMAIL || "e2e@test.local",
  password: process.env.E2E_PASSWORD || "TestPassword123!",
};

test.describe("Authentication", () => {
  test("sign in with valid credentials", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sign in with invalid credentials shows error", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill("invalid@test.local");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|failed|error/i)).toBeVisible({ timeout: 10000 });
  });

  test("sign out redirects to signin", async ({ page }) => {
    // Sign in first
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Open the user dropdown (avatar button in header) and click Sign out
    const avatarBtn = page.locator("header").locator("[aria-haspopup='menu'], [aria-expanded]");
    await avatarBtn.click();
    await page.getByText("Sign out").click();
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
  });

  test("protected route redirects when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);
  });
});
