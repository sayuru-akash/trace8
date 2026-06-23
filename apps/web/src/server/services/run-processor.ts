import { db } from "@/lib/db";

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

  return run;
}
