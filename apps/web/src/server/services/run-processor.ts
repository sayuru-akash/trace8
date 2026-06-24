import { db } from "@/lib/db";
import { recalculateProjectFlakiness } from "@/server/services/flakiness";
import { evaluateAlerts } from "@/server/services/alerts";

export async function processRunResults(runId: string) {
  const testResults = await db.testResult.findMany({
    where: { runId },
    orderBy: { createdAt: "asc" },
  });

  // Deduplicate by testId: keep only the LAST result per test.
  // Playwright can produce multiple results for the same test (retries);
  // the final status is what matters for run summary counts.
  const lastResultByTest = new Map<string, typeof testResults[number]>();
  for (const tr of testResults) {
    lastResultByTest.set(tr.testId, tr);
  }
  const finalResults = Array.from(lastResultByTest.values());

  const total = finalResults.length;
  const passed = finalResults.filter((r) => r.status === "passed").length;
  const failed = finalResults.filter((r) => r.status === "failed").length;
  const skipped = finalResults.filter((r) => r.status === "skipped").length;
  const timedOut = finalResults.filter((r) => r.status === "timed_out").length;

  // Retry count: sum of retryCount across ALL results (including intermediate attempts)
  const retryCount = testResults.reduce((sum, r) => sum + r.retryCount, 0);

  const run = await db.run.update({
    where: { id: runId },
    data: {
      total,
      passed,
      failed,
      skipped,
      timedOut,
      retryCount,
    },
  });

  // Recalculate flakiness scores for all tests in this project
  await recalculateProjectFlakiness(run.projectId).catch((err) => {
    console.error("Flakiness recalculation failed:", err);
  });

  // Evaluate alert rules
  await evaluateAlerts(runId).catch((err) => {
    console.error("Alert evaluation failed:", err);
  });

  return run;
}
