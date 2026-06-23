import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectsList } from "@/components/projects/projects-list";

export default async function ProjectsPage() {
  const session = await auth();

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });

  if (!orgMember) {
    return <ProjectsList projects={[]} />;
  }

  const projects = await db.project.findMany({
    where: { orgId: orgMember.orgId, archivedAt: null },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, createdAt: true },
      },
      environments: true,
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <ProjectsList projects={projects} />;
}
