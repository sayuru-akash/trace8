import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const setting = await db.appSetting.findUnique({
      where: { key: "ai.config" },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, message: "AI configuration not found" },
        { status: 404 }
      );
    }

    const value = setting.value as Record<string, unknown>;
    let apiKey = "";
    if (value.apiKey && typeof value.apiKey === "string") {
      try {
        apiKey = decrypt(value.apiKey);
      } catch {
        return NextResponse.json(
          { success: false, message: "Failed to decrypt API key" },
          { status: 500 }
        );
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "No API key configured" },
        { status: 400 }
      );
    }

    const apiUrl = (value.apiUrl as string) ?? "https://api.openai.com/v1";
    const model = (value.model as string) ?? "gpt-4o";

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
      return NextResponse.json({
        success: false,
        message: `API returned ${response.status}: ${errorText}`,
      });
    }

    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
