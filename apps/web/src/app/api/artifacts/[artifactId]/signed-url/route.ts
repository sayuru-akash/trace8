import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { artifactId } = await params;

    if (!rateLimit(`artifact-url:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const artifact = await db.artifact.findUnique({
      where: { id: artifactId },
      include: {
        run: {
          include: { project: true },
        },
      },
    });

    if (!artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    const membership = await db.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: artifact.run.project.orgId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const storage = getStorage();
    const signedUrl = await storage.getSignedReadUrl(artifact.storageKey);

    return NextResponse.json({
      readUrl: signedUrl.readUrl,
      expiresAt: signedUrl.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Get signed URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
