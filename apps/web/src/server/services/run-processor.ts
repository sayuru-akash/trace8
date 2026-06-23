import { db } from "@/lib/db";
import { recalculateProjectFlakiness } from "@/server/services/flakiness";
import { evaluateAlerts } from "@/server/services/alerts";

export async function processRunResults(runId: string) {
  const testResults = await db.testResult.findMany({
    where: { runId },
  });

  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === "passed").length;
  const failed = testResults.filter((r) => r.status === "failed").length;
  const skipped = testResults.filter((r) => r.status === "skipped").length;
  const timedOut = testResults.filter((r) => r.status === "timed_out").length;
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
