import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "E2E Test User",
  email: `e2e-${Date.now()}@test.local`,
  password: "TestPassword123!",
};

test.describe("Authentication", () => {
  test("sign up creates account and redirects to dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel(/name/i).fill(TEST_USER.name);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign up|create account|register/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

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
    await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
  });

  test("sign out redirects to signin", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: /sign out|log out|logout/i }).click();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("protected route redirects when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);
  });
});
