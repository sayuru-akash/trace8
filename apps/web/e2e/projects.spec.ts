import { test, expect } from "@playwright/test";

test.describe("Projects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || "e2e@test.local");
    await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || "TestPassword123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("create a project", async ({ page }) => {
    await page.getByRole("button", { name: /new project|create project/i }).click();
    await page.getByLabel(/name/i).fill(`E2E Project ${Date.now()}`);
    await page.getByRole("button", { name: /create|submit|save/i }).click();
    await expect(page.getByText(/e2e project/i)).toBeVisible();
  });

  test("view project detail", async ({ page }) => {
    await page.getByText(/e2e project/i).first().click();
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByText(/runs|tests/i)).toBeVisible();
  });

  test("view project settings", async ({ page }) => {
    await page.getByText(/e2e project/i).first().click();
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
