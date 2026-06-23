"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { sendSlackAlert, buildSlackMessage } from "@/server/services/alerts";
import { revalidatePath } from "next/cache";

const alertRuleSchema = z.object({
  type: z.enum([
    "failed_production_run",
    "new_failing_test",
    "failure_spike",
    "flaky_test_spike",
  ]),
});

const saveAlertConfigSchema = z.object({
  projectId: z.string(),
  enabled: z.boolean(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  rules: z.array(alertRuleSchema),
});

export async function saveAlertConfig(
  projectId: string,
  config: {
    enabled: boolean;
    webhookUrl?: string;
    rules: { type: string }[];
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMember) throw new Error("No organization found");

  const project = await db.project.findFirst({
    where: { id: projectId, orgId: orgMember.orgId },
  });
  if (!project) throw new Error("Project not found");

  const encryptedWebhookUrl = config.webhookUrl
    ? encrypt(config.webhookUrl)
    : null;

  const rulesJson = { rules: config.rules };

  const existing = await db.alert.findFirst({
    where: { projectId },
  });

  if (existing) {
    await db.alert.update({
      where: { id: existing.id },
      data: {
        enabled: config.enabled,
        encryptedWebhookUrl,
        rules: rulesJson,
      },
    });
  } else {
    await db.alert.create({
      data: {
        projectId,
        enabled: config.enabled,
        encryptedWebhookUrl,
        rules: rulesJson,
      },
    });
  }

  revalidatePath("/alerts");
}

export async function getAlertConfig(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMember) throw new Error("No organization found");

  const project = await db.project.findFirst({
    where: { id: projectId, orgId: orgMember.orgId },
  });
  if (!project) throw new Error("Project not found");

  const alert = await db.alert.findFirst({
    where: { projectId },
  });

  if (!alert) {
    return {
      enabled: false,
      webhookUrl: "",
      rules: [],
    };
  }

  let webhookUrl = "";
  if (alert.encryptedWebhookUrl) {
    try {
      webhookUrl = decrypt(alert.encryptedWebhookUrl);
    } catch {
      webhookUrl = "";
    }
  }

  const rulesObj = alert.rules as Record<string, unknown>;
  const rules = Array.isArray(rulesObj?.rules)
    ? (rulesObj.rules as { type: string }[])
    : [];

  return {
    enabled: alert.enabled,
    webhookUrl,
    rules,
  };
}

export async function testAlert(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMember) throw new Error("No organization found");

  const project = await db.project.findFirst({
    where: { id: projectId, orgId: orgMember.orgId },
  });
  if (!project) throw new Error("Project not found");

  const alert = await db.alert.findFirst({
    where: { projectId },
  });

  if (!alert?.encryptedWebhookUrl) {
    throw new Error("No webhook URL configured");
  }

  let webhookUrl: string;
  try {
    webhookUrl = decrypt(alert.encryptedWebhookUrl);
  } catch {
    throw new Error("Failed to decrypt webhook URL");
  }

  const testPayload = buildSlackMessage(
    {
      id: "test-run-id",
      status: "failed",
      failed: 2,
      passed: 8,
      total: 10,
      branch: "main",
      commitSha: "abc12345",
    },
    project.name,
    [
      {
        title: "Example test should pass",
        file: "tests/example.spec.ts",
        error: "Expected element to be visible",
      },
      {
        title: "Login flow should work",
        file: "tests/auth.spec.ts",
        error: "Timeout waiting for selector",
      },
    ],
    { environmentSlug: "production", branch: "main", commitSha: "abc12345" }
  );

  const sent = await sendSlackAlert(webhookUrl, testPayload);
  if (!sent) {
    throw new Error("Failed to send test alert. Check your webhook URL.");
  }

  return { success: true };
}
