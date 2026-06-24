import { test, expect } from "@playwright/test";

const PROJECT_NAME = `E2E Project ${Date.now()}`;

test.describe("Projects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL || "e2e@test.local");
    await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD || "TestPassword123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    // Navigate to the projects page where the "New Project" button lives
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/projects/);
  });

  test("create a project", async ({ page }) => {
    await page.getByRole("button", { name: /new project/i }).click();
    // The dialog has a name input — target it specifically within the dialog
    await page.getByRole("dialog").getByLabel(/name/i).fill(PROJECT_NAME);
    await page.getByRole("dialog").getByRole("button", { name: /create|submit|save/i }).click();
    // After creation, the project should appear in the list
    await expect(page.getByText(PROJECT_NAME)).toBeVisible({ timeout: 10000 });
  });

  test("view project detail", async ({ page }) => {
    // Create a project first so we have one to view
    await page.getByRole("button", { name: /new project/i }).click();
    await page.getByRole("dialog").getByLabel(/name/i).fill(PROJECT_NAME + " Detail");
    await page.getByRole("dialog").getByRole("button", { name: /create|submit|save/i }).click();
    await expect(page.getByText(PROJECT_NAME + " Detail")).toBeVisible({ timeout: 10000 });

    // Click into the project
    await page.getByText(PROJECT_NAME + " Detail").first().click();
    await expect(page).toHaveURL(/\/projects\//);
  });

  test("view project settings", async ({ page }) => {
    // Create a project first
    await page.getByRole("button", { name: /new project/i }).click();
    await page.getByRole("dialog").getByLabel(/name/i).fill(PROJECT_NAME + " Settings");
    await page.getByRole("dialog").getByRole("button", { name: /create|submit|save/i }).click();
    await expect(page.getByText(PROJECT_NAME + " Settings")).toBeVisible({ timeout: 10000 });

    // Navigate to project settings
    await page.getByText(PROJECT_NAME + " Settings").first().click();
    await page.getByRole("link", { name: /settings/i }).first().click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
