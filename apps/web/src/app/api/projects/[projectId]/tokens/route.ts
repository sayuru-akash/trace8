import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

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

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Token name is required" },
        { status: 400 }
      );
    }

    const token = generateToken();
    const tokenHash = hashToken(token);

    const projectToken = await db.projectToken.create({
      data: {
        projectId,
        name: name.trim(),
        tokenHash,
      },
    });

    return NextResponse.json(
      {
        id: projectToken.id,
        name: projectToken.name,
        token,
        createdAt: projectToken.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
