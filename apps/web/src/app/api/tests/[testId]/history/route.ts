import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId } = await params;

    const test = await db.test.findUnique({
      where: { id: testId },
      include: { project: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const membership = await db.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: test.project.orgId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = await db.testResult.findMany({
      where: { testId },
      include: {
        run: {
          select: {
            id: true,
            startedAt: true,
            branch: true,
            commitSha: true,
            status: true,
            environmentId: true,
          },
        },
        artifacts: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const serialized = results.map((r) => ({
      ...r,
      artifacts: r.artifacts.map((a) => ({
        ...a,
        sizeBytes: a.sizeBytes.toString(),
      })),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Get test history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
