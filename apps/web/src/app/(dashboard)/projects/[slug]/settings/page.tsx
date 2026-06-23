import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectSettings } from "@/components/projects/project-settings";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });
  if (!orgMember) notFound();

  const project = await db.project.findFirst({
    where: { orgId: orgMember.orgId, slug, archivedAt: null },
    include: {
      environments: true,
      tokens: {
        where: { revokedAt: null },
        select: {
          id: true,
          name: true,
          createdAt: true,
          lastUsedAt: true,
          revokedAt: true,
        },
      },
      _count: { select: { runs: true, tests: true } },
    },
  });

  if (!project) notFound();

  return <ProjectSettings project={project} />;
}
