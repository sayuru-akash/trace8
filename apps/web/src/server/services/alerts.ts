import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

interface SlackMessagePayload {
  blocks: SlackBlock[];
}

interface AlertRule {
  type: string;
}

function parseRules(rulesJson: unknown): AlertRule[] {
  if (!rulesJson || typeof rulesJson !== "object") return [];
  const obj = rulesJson as Record<string, unknown>;
  if (!Array.isArray(obj.rules)) return [];
  return obj.rules as AlertRule[];
}

export async function evaluateAlerts(runId: string): Promise<void> {
  const run = await db.run.findUnique({
    where: { id: runId },
    include: {
      project: {
        include: {
          alerts: { where: { enabled: true } },
          environments: true,
        },
      },
      testResults: true,
    },
  });

  if (!run || run.project.alerts.length === 0) return;

  const environment = run.environmentId
    ? await db.environment.findUnique({ where: { id: run.environmentId } })
    : null;

  const environmentSlug = environment?.slug ?? "unknown";

  const failedTestResults = run.testResults.filter(
    (r) => r.status === "failed"
  );
  const failedTestKeys: string[] = [];

  for (const tr of failedTestResults) {
    const test = await db.test.findUnique({ where: { id: tr.testId } });
    if (test) failedTestKeys.push(test.stableKey);
  }
  failedTestKeys.sort();

  for (const alert of run.project.alerts) {
    const rules = parseRules(alert.rules);
    const triggeredRules: string[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case "failed_production_run":
          if (run.status === "failed" && environmentSlug === "production") {
            triggeredRules.push(rule.type);
          }
          break;

        case "new_failing_test": {
          const previousRuns = await db.run.findMany({
            where: {
              projectId: run.projectId,
              id: { not: run.id },
              createdAt: { lt: run.createdAt },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true },
          });

          if (previousRuns.length > 0) {
            const previousRunIds = previousRuns.map((r) => r.id);
            const previousPassedResults = await db.testResult.findMany({
              where: {
                runId: { in: previousRunIds },
                status: "passed",
              },
              select: { testId: true },
            });
            const previouslyPassingIds = new Set(
              previousPassedResults.map((r) => r.testId)
            );

            const newFailures = failedTestResults.filter((tr) =>
              previouslyPassingIds.has(tr.testId)
            );
            if (newFailures.length > 0) {
              triggeredRules.push(rule.type);
            }
          }
          break;
        }

        case "failure_spike": {
          const lastFiveRuns = await db.run.findMany({
            where: {
              projectId: run.projectId,
              id: { not: run.id },
              createdAt: { lt: run.createdAt },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { failed: true },
          });

          if (lastFiveRuns.length > 0) {
            const avgFailed =
              lastFiveRuns.reduce((sum, r) => sum + r.failed, 0) /
              lastFiveRuns.length;
            if (run.failed > avgFailed * 2) {
              triggeredRules.push(rule.type);
            }
          }
          break;
        }

        case "flaky_test_spike": {
          const flakyTests = await db.flakyTestStat.findMany({
            where: {
              projectId: run.projectId,
              classification: { in: ["flaky", "watch"] },
            },
          });
          if (flakyTests.length > 0) {
            triggeredRules.push(rule.type);
          }
          break;
        }
      }
    }

    if (triggeredRules.length === 0) continue;

    const dedupeKey = `${run.projectId}:${environmentSlug}:${run.branch ?? "no-branch"}:${failedTestKeys.join(",")}`;

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingEvent = await db.alertEvent.findFirst({
      where: {
        dedupeKey,
        status: "sent",
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (existingEvent) continue;

    let webhookUrl: string | null = null;
    if (alert.encryptedWebhookUrl) {
      try {
        webhookUrl = decrypt(alert.encryptedWebhookUrl);
      } catch {
        console.error(`Failed to decrypt webhook URL for alert ${alert.id}`);
      }
    }

    if (!webhookUrl) continue;

    const failedTests = await Promise.all(
      failedTestResults.slice(0, 10).map(async (tr) => {
        const test = await db.test.findUnique({ where: { id: tr.testId } });
        return {
          title: test?.titlePath?.join(" > ") ?? "Unknown test",
          file: test?.filePath ?? "Unknown file",
          error: tr.errorMessage ?? "No error message",
        };
      })
    );

    const payload = buildSlackMessage(run, run.project.name, failedTests, {
      environmentSlug,
      branch: run.branch,
      commitSha: run.commitSha,
    });

    const sent = await sendSlackAlert(webhookUrl, payload);

    await db.alertEvent.create({
      data: {
        projectId: run.projectId,
        runId: run.id,
        alertId: alert.id,
        dedupeKey,
        status: sent ? "sent" : "failed",
        sentAt: sent ? new Date() : undefined,
        error: sent ? undefined : "Slack webhook delivery failed",
      },
    });
  }
}

export async function sendSlackAlert(
  webhookUrl: string,
  payload: SlackMessagePayload
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function buildSlackMessage(
  run: { id: string; status: string; failed: number; passed: number; total: number; branch?: string | null; commitSha?: string | null },
  projectName: string,
  failedTests: { title: string; file: string; error: string }[],
  context: { environmentSlug: string; branch?: string | null; commitSha?: string | null }
): SlackMessagePayload {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const runUrl = `${baseUrl}/runs/${run.id}`;

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Test Run Failed: ${projectName}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Project:*\n${projectName}` },
        { type: "mrkdwn", text: `*Environment:*\n${context.environmentSlug}` },
        { type: "mrkdwn", text: `*Branch:*\n${context.branch ?? "N/A"}` },
        {
          type: "mrkdwn",
          text: `*Commit:*\n${context.commitSha?.slice(0, 8) ?? "N/A"}`,
        },
        { type: "mrkdwn", text: `*Passed:*\n${run.passed}` },
        { type: "mrkdwn", text: `*Failed:*\n${run.failed}` },
      ],
    },
  ];

  if (failedTests.length > 0) {
    const testList = failedTests
      .map((t) => `\u2022 ${t.title}\n  \`${t.file}\``)
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Failed Tests:*\n${testList}`,
      },
    });
  }

  blocks.push(
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${runUrl}|View Run>`,
      },
    }
  );

  return { blocks };
}
