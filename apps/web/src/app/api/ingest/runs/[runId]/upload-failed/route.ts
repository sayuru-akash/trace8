import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateIngestionToken } from "@/lib/ingest-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const auth = await authenticateIngestionToken(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    const run = await db.run.findUnique({
      where: { id: runId },
    });

    if (!run || run.projectId !== auth.projectId) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    await db.run.update({
      where: { id: runId },
      data: { status: "upload_failed" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Upload-failed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
