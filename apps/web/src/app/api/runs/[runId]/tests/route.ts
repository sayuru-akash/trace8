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
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));

    const run = await db.run.findUnique({
      where: { id: runId },
      include: { project: true },
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

    const where = { runId };
    const totalCount = await db.testResult.count({ where });

    const testResults = await db.testResult.findMany({
      where,
      include: {
        test: true,
        artifacts: true,
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const serialized = testResults.map((tr) => ({
      ...tr,
      artifacts: tr.artifacts.map((a) => ({
        ...a,
        sizeBytes: a.sizeBytes.toString(),
      })),
    }));

    return NextResponse.json({
      data: serialized,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get run tests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
