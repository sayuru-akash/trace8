import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export interface IngestionAuthResult {
  projectId: string;
  orgId: string;
  environmentSlug: string;
}

export async function authenticateIngestionToken(
  request: Request
): Promise<IngestionAuthResult | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const tokenHash = hashToken(token);

  const projectToken = await db.projectToken.findUnique({
    where: { tokenHash },
    include: {
      project: {
        include: { org: true },
      },
    },
  });

  if (!projectToken || projectToken.revokedAt) return null;

  await db.projectToken.update({
    where: { id: projectToken.id },
    data: { lastUsedAt: new Date() },
  });

  const envHeader = request.headers.get("X-Environment");
  const environmentSlug = envHeader || "local";

  return {
    projectId: projectToken.projectId,
    orgId: projectToken.project.orgId,
    environmentSlug,
  };
}
