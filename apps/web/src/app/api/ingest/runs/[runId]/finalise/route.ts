import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateIngestionToken } from "@/lib/ingest-auth";
import { finaliseRunPayloadSchema } from "@trace8/shared";

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

    const body = await request.json();
    const parsed = finaliseRunPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { uploadedArtifacts } = parsed.data;

    for (const artifactUpdate of uploadedArtifacts) {
      await db.artifact.updateMany({
        where: {
          runId,
          artifactKey: artifactUpdate.artifactKey,
          storageKey: artifactUpdate.storageKey,
        },
        data: {
          uploaded: artifactUpdate.uploaded,
        },
      });
    }

    await db.run.update({
      where: { id: runId },
      data: { status: run.status },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const runUrl = `${baseUrl}/projects/${run.projectId}/runs/${runId}`;

    return NextResponse.json({ ok: true, runUrl });
  } catch (error) {
    console.error("Finalise error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
