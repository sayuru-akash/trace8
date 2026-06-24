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
    // The welcome heading is unique on the dashboard
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  test("dashboard shows empty state or project content", async ({ page }) => {
    // The dashboard always shows either an empty-state CTA or project cards.
    // Either is valid — verify the page rendered meaningful content.
    const welcome = page.getByRole("heading", { name: /welcome/i });
    await expect(welcome).toBeVisible();
    // Verify either empty-state guidance or project data is present
    const emptyState = page.getByText(/no projects|get started|create your first/i);
    const projectSection = page.getByText(/recent projects/i);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasProjects = await projectSection.isVisible().catch(() => false);
    expect(hasEmpty || hasProjects).toBeTruthy();
  });

  test("navigation to runs page", async ({ page }) => {
    await page.getByRole("link", { name: "Runs", exact: true }).click();
    await expect(page).toHaveURL(/\/runs/);
  });

  test("navigation to tests page", async ({ page }) => {
    await page.getByRole("link", { name: "Tests", exact: true }).click();
    await expect(page).toHaveURL(/\/tests/);
  });

  test("navigation to flaky tests page", async ({ page }) => {
    await page.getByRole("link", { name: /flaky/i }).click();
    await expect(page).toHaveURL(/\/flaky/);
  });

  test("navigation to alerts page", async ({ page }) => {
    await page.getByRole("link", { name: "Alerts", exact: true }).click();
    await expect(page).toHaveURL(/\/alerts/);
  });

  test("navigation to settings page", async ({ page }) => {
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
