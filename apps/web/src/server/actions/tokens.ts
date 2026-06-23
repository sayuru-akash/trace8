"use server";

import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TOKEN_PREFIX } from "@trace8/shared";
import { revalidatePath } from "next/cache";

const createTokenSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "Token name is required").max(100),
});

function generateToken(): string {
  const random = randomBytes(32).toString("hex");
  return `${TOKEN_PREFIX}${random}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createToken(projectId: string, name: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = createTokenSchema.safeParse({ projectId, name });
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const token = generateToken();
  const tokenHash = hashToken(token);

  await db.projectToken.create({
    data: {
      projectId,
      name,
      tokenHash,
    },
  });

  revalidatePath(`/projects`);
  return token;
}

export async function rotateToken(tokenId: string, projectId: string, name: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.projectToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  return createToken(projectId, name);
}

export async function revokeToken(tokenId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await db.projectToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/projects`);
}

export async function getTokens(projectId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return db.projectToken.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });
}
