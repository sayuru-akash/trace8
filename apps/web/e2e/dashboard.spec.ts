import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || "e2e@test.local");
    await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || "TestPassword123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("dashboard loads with stats", async ({ page }) => {
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test("dashboard shows empty state when no projects", async ({ page }) => {
    const emptyState = page.getByText(/no projects|get started|create your first/i);
    const projectCard = page.getByText(/e2e project/i);
    const hasProject = await projectCard.isVisible().catch(() => false);
    if (!hasProject) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("navigation to runs page", async ({ page }) => {
    await page.getByRole("link", { name: /runs/i }).click();
    await expect(page).toHaveURL(/\/runs/);
  });

  test("navigation to tests page", async ({ page }) => {
    await page.getByRole("link", { name: /tests/i }).click();
    await expect(page).toHaveURL(/\/tests/);
  });

  test("navigation to flaky tests page", async ({ page }) => {
    await page.getByRole("link", { name: /flaky/i }).click();
    await expect(page).toHaveURL(/\/flaky/);
  });

  test("navigation to alerts page", async ({ page }) => {
    await page.getByRole("link", { name: /alerts/i }).click();
    await expect(page).toHaveURL(/\/alerts/);
  });

  test("navigation to settings page", async ({ page }) => {
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
