"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

interface AiConfig {
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  enabled: boolean;
}

export async function getAiConfig(): Promise<AiConfig> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");

  const setting = await db.appSetting.findUnique({
    where: { key: "ai.config" },
  });

  if (!setting) {
    return {
      provider: "openai",
      apiKey: "",
      apiUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
      enabled: false,
    };
  }

  const value = setting.value as Record<string, unknown>;
  let apiKey = "";
  if (value.apiKey && typeof value.apiKey === "string") {
    try {
      apiKey = decrypt(value.apiKey);
    } catch {
      apiKey = "";
    }
  }

  return {
    provider: (value.provider as string) ?? "openai",
    apiKey,
    apiUrl: (value.apiUrl as string) ?? "https://api.openai.com/v1",
    model: (value.model as string) ?? "gpt-4o",
    enabled: (value.enabled as boolean) ?? false,
  };
}

export async function saveAiConfig(config: AiConfig) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");

  const encryptedApiKey = config.apiKey ? encrypt(config.apiKey) : "";

  await db.appSetting.upsert({
    where: { key: "ai.config" },
    update: {
      value: {
        provider: config.provider,
        apiKey: encryptedApiKey,
        apiUrl: config.apiUrl,
        model: config.model,
        enabled: config.enabled,
      },
    },
    create: {
      key: "ai.config",
      value: {
        provider: config.provider,
        apiKey: encryptedApiKey,
        apiUrl: config.apiUrl,
        model: config.model,
        enabled: config.enabled,
      },
    },
  });

  revalidatePath("/admin");
}

export async function testAiConnection() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");

  const setting = await db.appSetting.findUnique({
    where: { key: "ai.config" },
  });

  if (!setting) throw new Error("AI configuration not found");

  const value = setting.value as Record<string, unknown>;
  let apiKey = "";
  if (value.apiKey && typeof value.apiKey === "string") {
    try {
      apiKey = decrypt(value.apiKey);
    } catch {
      throw new Error("Failed to decrypt API key");
    }
  }

  if (!apiKey) throw new Error("No API key configured");

  const apiUrl = (value.apiUrl as string) ?? "https://api.openai.com/v1";
  const model = (value.model as string) ?? "gpt-4o";

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Say 'hello' in one word." }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `API returned ${response.status}: ${errorText}`,
      };
    }

    return { success: true, message: "Connection successful" };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export async function getSystemStats() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");

  const [users, orgs, projects, runs] = await Promise.all([
    db.user.count(),
    db.org.count(),
    db.project.count(),
    db.run.count(),
  ]);

  const storageResult = await db.artifact.aggregate({
    _sum: { sizeBytes: true },
  });

  return {
    users,
    orgs,
    projects,
    runs,
    storageBytes: storageResult._sum.sizeBytes?.toString() ?? "0",
  };
}
