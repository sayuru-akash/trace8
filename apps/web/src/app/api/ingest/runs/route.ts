import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateIngestionToken } from "@/lib/ingest-auth";
import { getStorage } from "@/lib/storage";
import { generateStableKey } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { createRunPayloadSchema, SCHEMA_VERSION, LIMITS } from "@trace8/shared";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const auth = await authenticateIngestionToken(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!rateLimit(`runs:${auth.projectId}`, 10, 60_000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = createRunPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    if (payload.schemaVersion !== SCHEMA_VERSION) {
      return NextResponse.json(
        { error: `Schema version mismatch. Expected ${SCHEMA_VERSION}, got ${payload.schemaVersion}` },
        { status: 400 }
      );
    }

    const { projectId, orgId } = auth;

    const environment = await db.environment.upsert({
      where: {
        projectId_slug: {
          projectId,
          slug: payload.project.environment,
        },
      },
      update: {},
      create: {
        projectId,
        name: payload.project.environment,
        slug: payload.project.environment,
      },
    });

    const totalArtifacts = payload.tests.reduce(
      (sum, t) => sum + t.artifacts.length,
      0
    );
    if (totalArtifacts > LIMITS.MAX_ARTIFACTS_PER_RUN) {
      return NextResponse.json(
        { error: `Too many artifacts. Max ${LIMITS.MAX_ARTIFACTS_PER_RUN}, got ${totalArtifacts}` },
        { status: 400 }
      );
    }

    const totalArtifactBytes = payload.tests.reduce(
      (sum, t) => sum + t.artifacts.reduce((s, a) => s + a.sizeBytes, 0),
      0
    );
    if (totalArtifactBytes > LIMITS.MAX_TOTAL_ARTIFACT_SIZE_PER_RUN) {
      return NextResponse.json(
        { error: `Total artifact size exceeds limit of ${LIMITS.MAX_TOTAL_ARTIFACT_SIZE_PER_RUN} bytes` },
        { status: 400 }
      );
    }

    for (const test of payload.tests) {
      for (const artifact of test.artifacts) {
        if (artifact.sizeBytes > LIMITS.MAX_ARTIFACT_FILE_SIZE) {
          return NextResponse.json(
            { error: `Artifact ${artifact.artifactKey} exceeds max file size of ${LIMITS.MAX_ARTIFACT_FILE_SIZE} bytes` },
            { status: 400 }
          );
        }
      }
    }

    let remoteUrlHash: string | undefined;
    if (payload.git?.remoteUrl) {
      remoteUrlHash = createHash("sha256")
        .update(payload.git.remoteUrl)
        .digest("hex");
    }

    const run = await db.run.create({
      data: {
        projectId,
        environmentId: environment.id,
        status: payload.run.status,
        sourceType: payload.source.type,
        cliVersion: payload.source.cliVersion,
        branch: payload.git?.branch,
        commitSha: payload.git?.commitSha,
        commitMessage: payload.git?.commitMessage,
        remoteUrlHash,
        startedAt: new Date(payload.run.startedAt),
        finishedAt: payload.run.finishedAt
          ? new Date(payload.run.finishedAt)
          : undefined,
        durationMs: payload.run.durationMs,
        total: payload.summary.total,
        passed: payload.summary.passed,
        failed: payload.summary.failed,
        skipped: payload.summary.skipped,
        timedOut: payload.summary.timedOut,
        retryCount: payload.summary.retries,
      },
    });

    const storage = getStorage();
    const artifactUploads: {
      artifactKey: string;
      uploadUrl: string;
      storageKey: string;
      expiresAt: string;
    }[] = [];

    for (const testInput of payload.tests) {
      const stableKey = generateStableKey(
        projectId,
        testInput.filePath,
        testInput.titlePath,
        testInput.projectName
      );

      const test = await db.test.upsert({
        where: {
          projectId_stableKey: {
            projectId,
            stableKey,
          },
        },
        update: {},
        create: {
          projectId,
          filePath: testInput.filePath,
          titlePath: testInput.titlePath,
          browserProjectName: testInput.projectName,
          stableKey,
        },
      });

      const testResult = await db.testResult.create({
        data: {
          runId: run.id,
          testId: test.id,
          status: testInput.status,
          durationMs: testInput.durationMs,
          retryCount: testInput.retryCount,
          errorMessage: testInput.error?.message,
          errorStack: testInput.error?.stack,
          stdout: testInput.stdout,
          stderr: testInput.stderr,
        },
      });

      for (const artifactInput of testInput.artifacts) {
        const signedUrl = await storage.getSignedUploadUrl(
          orgId,
          projectId,
          run.id,
          artifactInput.artifactKey,
          artifactInput.fileName,
          artifactInput.mimeType,
          artifactInput.sizeBytes
        );

        await db.artifact.create({
          data: {
            runId: run.id,
            testResultId: testResult.id,
            artifactKey: artifactInput.artifactKey,
            type: artifactInput.type,
            storageKey: signedUrl.storageKey,
            fileName: artifactInput.fileName,
            mimeType: artifactInput.mimeType,
            sizeBytes: BigInt(artifactInput.sizeBytes),
            uploaded: false,
            expiresAt: signedUrl.expiresAt,
          },
        });

        artifactUploads.push({
          artifactKey: artifactInput.artifactKey,
          uploadUrl: signedUrl.uploadUrl,
          storageKey: signedUrl.storageKey,
          expiresAt: signedUrl.expiresAt.toISOString(),
        });
      }
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await db.usageCounter.upsert({
      where: {
        orgId_month: {
          orgId,
          month,
        },
      },
      update: {
        runsCount: { increment: 1 },
        artifactBytes: { increment: BigInt(totalArtifactBytes) },
      },
      create: {
        orgId,
        projectId,
        month,
        runsCount: 1,
        artifactBytes: BigInt(totalArtifactBytes),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const runUrl = `${baseUrl}/runs/${run.id}`;

    return NextResponse.json({
      runId: run.id,
      runUrl,
      artifactUploads,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
