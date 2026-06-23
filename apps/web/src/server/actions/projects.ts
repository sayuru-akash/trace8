"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ENVIRONMENTS } from "@trace8/shared";
import { revalidatePath } from "next/cache";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
});

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMember) throw new Error("No organization found");

  const { name } = parsed.data;
  const slug = slugify(name);

  const existing = await db.project.findFirst({
    where: { orgId: orgMember.orgId, slug },
  });
  if (existing) throw new Error("A project with this name already exists");

  const project = await db.project.create({
    data: {
      orgId: orgMember.orgId,
      name,
      slug,
      environments: {
        create: ENVIRONMENTS.map((env) => ({
          name: env,
          slug: env,
        })),
      },
    },
  });

  revalidatePath("/projects");
  return project;
}

export async function getProjects() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMember) return [];

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

  return projects;
}

export async function getProject(slug: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!orgMember) throw new Error("No organization found");

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
        },
      },
      _count: { select: { runs: true, tests: true } },
    },
  });

  if (!project) throw new Error("Project not found");

  const latestRun = await db.run.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true },
  });

  return { ...project, latestRun };
}

export async function archiveProject(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.project.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  revalidatePath("/projects");
}
