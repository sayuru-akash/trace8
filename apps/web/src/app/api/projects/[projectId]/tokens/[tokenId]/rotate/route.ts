import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; tokenId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, tokenId } = await params;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const membership = await db.orgMember.findUnique({
      where: {
        orgId_userId: {
          orgId: project.orgId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingToken = await db.projectToken.findFirst({
      where: {
        id: tokenId,
        projectId,
        revokedAt: null,
      },
    });

    if (!existingToken) {
      return NextResponse.json(
        { error: "Token not found" },
        { status: 404 }
      );
    }

    const newToken = generateToken();
    const newTokenHash = hashToken(newToken);

    const updated = await db.projectToken.update({
      where: { id: tokenId },
      data: { tokenHash: newTokenHash },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      token: newToken,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    console.error("Rotate token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
