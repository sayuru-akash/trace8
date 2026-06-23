import { db } from "@/lib/db";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function incrementUsage(
  orgId: string,
  projectId: string,
  artifactBytes: number
) {
  const month = getCurrentMonth();

  await db.usageCounter.upsert({
    where: {
      orgId_month: {
        orgId,
        month,
      },
    },
    update: {
      runsCount: { increment: 1 },
      artifactBytes: { increment: BigInt(artifactBytes) },
    },
    create: {
      orgId,
      projectId,
      month,
      runsCount: 1,
      artifactBytes: BigInt(artifactBytes),
    },
  });
}

export async function getUsage(orgId: string) {
  const currentMonth = getCurrentMonth();

  const current = await db.usageCounter.findUnique({
    where: {
      orgId_month: {
        orgId,
        month: currentMonth,
      },
    },
  });

  const historical = await db.usageCounter.findMany({
    where: { orgId },
    orderBy: { month: "desc" },
    take: 12,
  });

  return {
    current: current
      ? {
          month: current.month,
          runsCount: current.runsCount,
          artifactBytes: current.artifactBytes.toString(),
        }
      : { month: currentMonth, runsCount: 0, artifactBytes: "0" },
    historical: historical.map((h) => ({
      month: h.month,
      runsCount: h.runsCount,
      artifactBytes: h.artifactBytes.toString(),
    })),
  };
}

export async function getProjectUsage(projectId: string) {
  const currentMonth = getCurrentMonth();

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { orgId: true },
  });
  if (!project) return null;

  const counter = await db.usageCounter.findUnique({
    where: {
      orgId_month: {
        orgId: project.orgId,
        month: currentMonth,
      },
    },
  });

  return {
    runsThisMonth: counter?.runsCount ?? 0,
    storageUsed: counter?.artifactBytes?.toString() ?? "0",
  };
}
