import { db } from "@/lib/db";
import { LIMITS } from "@trace8/shared";

export interface FlakeResult {
  passCount: number;
  failCount: number;
  retryPassCount: number;
  flakeScore: number;
  classification: "stable" | "watch" | "flaky" | "regression";
}

/**
 * Calculate flake score for a test based on last N results.
 *
 * Formula (SPEC §9.2):
 *   flake_score = (retry_pass_count * 0.5) + (status_flip_count * 0.3) + (recent_fail_pass_mix * 0.2)
 *
 * Classification:
 *   0.0–0.3 → stable
 *   0.3–0.6 → watch
 *   0.6–1.0 → flaky
 */
export async function calculateFlakeScore(
  testId: string,
  projectId: string
): Promise<FlakeResult> {
  const results = await db.testResult.findMany({
    where: { testId },
    orderBy: { createdAt: "desc" },
    take: LIMITS.FLAKE_WINDOW_SIZE,
  });

  // Reverse to chronological for flip counting
  const chrono = [...results].reverse();

  let passCount = 0;
  let failCount = 0;
  let retryPassCount = 0;

  for (const r of chrono) {
    if (r.status === "passed") {
      passCount++;
      if (r.retryCount > 0) retryPassCount++;
    } else if (r.status === "failed" || r.status === "timed_out") {
      failCount++;
    }
  }

  const total = chrono.length;

  // Normalised retry-pass component (0–1)
  const retryPassComponent = total > 0 ? Math.min(retryPassCount / total, 1) : 0;

  // Status flip counting: consecutive results that differ between pass/fail
  let flipCount = 0;
  for (let i = 1; i < chrono.length; i++) {
    const prev = chrono[i - 1];
    const curr = chrono[i];
    const prevIsPass = prev.status === "passed" || prev.status === "flaky";
    const currIsPass = curr.status === "passed" || curr.status === "flaky";
    if (prevIsPass !== currIsPass) flipCount++;
  }
  const maxFlips = Math.max(total - 1, 1);
  const flipComponent = flipCount / maxFlips;

  // Recent fail-pass mix: proportion of window that has both pass and fail
  let mixComponent = 0;
  if (passCount > 0 && failCount > 0 && total > 0) {
    const ratio = Math.min(passCount, failCount) / total;
    mixComponent = ratio * 2; // scale so 50/50 → 1
  }

  const flakeScore = Math.min(
    retryPassComponent * 0.5 + flipComponent * 0.3 + mixComponent * 0.2,
    1
  );

  let classification: FlakeResult["classification"];
  if (flakeScore < 0.3) classification = "stable";
  else if (flakeScore < 0.6) classification = "watch";
  else classification = "flaky";

  // Check regression override
  const isRegression = await detectRegression(testId, projectId);
  if (isRegression) classification = "regression";

  return {
    passCount,
    failCount,
    retryPassCount,
    flakeScore: Math.round(flakeScore * 100) / 100,
    classification,
  };
}

/**
 * Regression detection (SPEC §9.4):
 * - Test passed in previous 5 runs
 * - This run failed
 * - No retry passed
 * - Failure on main or production branch/environment
 */
export async function detectRegression(
  testId: string,
  projectId: string
): Promise<boolean> {
  const recent = await db.testResult.findMany({
    where: { testId },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      run: { include: { environment: true } },
    },
  });

  if (recent.length === 0) return false;

  const current = recent[0];
  const previous = recent.slice(1);

  // Current must be failed (not via retry)
  if (current.status !== "failed" && current.status !== "timed_out") return false;
  if (current.retryCount > 0) return false; // retry passed means not regression

  // Previous 5 must have passed
  const allPrevPassed = previous.length >= 1 && previous.every(
    (r) => r.status === "passed" || r.status === "flaky"
  );
  if (!allPrevPassed) return false;

  // Must be on main or production branch/environment
  const branch = current.run?.branch;
  const envSlug = current.run?.environment?.slug;
  const isMainOrProd =
    branch === "main" ||
    branch === "master" ||
    envSlug === "production";

  return isMainOrProd;
}

/**
 * Recalculate flakiness for a single test and upsert the stat.
 */
export async function recalculateTestFlakiness(testId: string): Promise<void> {
  const test = await db.test.findUnique({
    where: { id: testId },
    select: { projectId: true },
  });
  if (!test) return;

  const result = await calculateFlakeScore(testId, test.projectId);

  await db.flakyTestStat.upsert({
    where: {
      projectId_testId: { projectId: test.projectId, testId },
    },
    update: {
      passCount: result.passCount,
      failCount: result.failCount,
      retryPassCount: result.retryPassCount,
      flakeScore: result.flakeScore,
      classification: result.classification,
      calculatedAt: new Date(),
    },
    create: {
      projectId: test.projectId,
      testId,
      windowSize: LIMITS.FLAKE_WINDOW_SIZE,
      passCount: result.passCount,
      failCount: result.failCount,
      retryPassCount: result.retryPassCount,
      flakeScore: result.flakeScore,
      classification: result.classification,
    },
  });
}

/**
 * Recalculate flakiness for all tests in a project.
 * Called after each run is finalised.
 */
export async function recalculateProjectFlakiness(projectId: string): Promise<void> {
  const tests = await db.test.findMany({
    where: { projectId },
    select: { id: true },
  });

  for (const test of tests) {
    await recalculateTestFlakiness(test.id);
  }
}
