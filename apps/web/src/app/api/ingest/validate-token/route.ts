import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateIngestionToken } from "@/lib/ingest-auth";

export async function POST(request: Request) {
  try {
    const auth = await authenticateIngestionToken(request);
    if (!auth) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const project = await db.project.findUnique({
      where: { id: auth.projectId },
      include: {
        org: true,
        environments: true,
      },
    });

    if (!project) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      projectId: project.id,
      projectName: project.name,
      orgSlug: project.org.slug,
      environments: project.environments.map((e) => e.slug),
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
