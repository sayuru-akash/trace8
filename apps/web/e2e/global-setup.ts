import { request } from "@playwright/test";

/**
 * Global setup: ensure a deterministic test user exists before any E2E test runs.
 * Creates e2e@test.local via the signup API if it doesn't exist yet.
 * This user is shared across all test files (dashboard, projects, etc.).
 */
async function globalSetup() {
  const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
  const email = process.env.E2E_EMAIL || "e2e@test.local";
  const password = process.env.E2E_PASSWORD || "TestPassword123!";
  const name = "E2E Test User";

  const ctx = await request.newContext({ baseURL });

  // Try to create the user. If it already exists (409/conflict), that's fine.
  try {
    const res = await ctx.post("/api/auth/signup", {
      data: { name, email, password },
    });
    const status = res.status();
    if (status >= 200 && status < 300) {
      // eslint-disable-next-line no-console
      console.log(`  [global-setup] Created test user: ${email}`);
    } else if (status === 409 || status === 400) {
      // User likely already exists — that's fine
      console.log(`  [global-setup] Test user already exists: ${email}`);
    } else {
      console.warn(`  [global-setup] Unexpected status ${res.status()} creating test user`);
    }
  } catch (e) {
    // If signup fails (e.g., unique constraint), user probably exists already
    console.log(`  [global-setup] Test user exists or signup skipped: ${email}`);
  }

  await ctx.dispose();
}

export default globalSetup;
