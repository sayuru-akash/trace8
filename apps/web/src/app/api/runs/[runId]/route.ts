import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    const run = await db.run.findUnique({
      where: { id: runId },
      include: {
        project: true,
        environment: true,
        testResults: {
          include: {
            test: true,
            artifacts: true,
          },
          orderBy: { createdAt: "asc" },
        },
        artifacts: true,
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const membership = await db.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: run.project.orgId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serialized = {
      ...run,
      testResults: run.testResults.map((tr) => ({
        ...tr,
        artifacts: tr.artifacts.map((a) => ({
          ...a,
          sizeBytes: a.sizeBytes.toString(),
        })),
      })),
      artifacts: run.artifacts.map((a) => ({
        ...a,
        sizeBytes: a.sizeBytes.toString(),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Get run error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
