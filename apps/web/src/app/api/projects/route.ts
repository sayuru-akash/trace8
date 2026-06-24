import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));

    const orgMember = await db.orgMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!orgMember) {
      return NextResponse.json({ data: [], pagination: { page, limit, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false } });
    }

    const where = {
      orgId: orgMember.orgId,
      archivedAt: null,
    };

    const totalCount = await db.project.count({ where });

    const projects = await db.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { runs: true, tests: true } },
      },
    });

    return NextResponse.json({
      data: projects,
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
    console.error("List projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const orgMember = await db.orgMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!orgMember) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const slug = slugify(name);
    const existing = await db.project.findUnique({
      where: {
        orgId_slug: {
          orgId: orgMember.orgId,
          slug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A project with this name already exists" },
        { status: 409 }
      );
    }

    const project = await db.project.create({
      data: {
        orgId: orgMember.orgId,
        name: name.trim(),
        slug,
        environments: {
          create: [
            { name: "local", slug: "local" },
            { name: "staging", slug: "staging" },
            { name: "production", slug: "production" },
          ],
        },
      },
      include: { environments: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
