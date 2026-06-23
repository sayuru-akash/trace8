import { readFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { SCHEMA_VERSION } from "@trace8/shared";
import type { CreateRunPayload } from "@trace8/shared";
import { maskSecrets } from "./masking";

interface PlaywrightReport {
  config?: Record<string, unknown>;
  suites?: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title?: string;
  file?: string;
  specifications?: PlaywrightSpecification[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightSpecification {
  title?: string;
  tests?: PlaywrightTest[];
}

interface PlaywrightTest {
  projectName?: string;
  results?: PlaywrightTestResult[];
  status?: string;
  expectedStatus?: string;
}

interface PlaywrightTestResult {
  status?: string;
  duration?: number;
  retry?: number;
  error?: { message?: string; stack?: string };
  stdout?: string[];
  stderr?: string[];
  attachments?: { name: string; path?: string; contentType?: string }[];
}

export async function buildPayload(
  reportJson: string,
  environment: string
): Promise<CreateRunPayload> {
  const report: PlaywrightReport = JSON.parse(reportJson);

  const tests: CreateRunPayload["tests"] = [];
  const artifactPaths: { artifactKey: string; filePath: string; mimeType: string; type: string }[] = [];

  let startedAt = new Date().toISOString();
  let finishedAt: string | undefined;
  let totalDurationMs = 0;

  const allResults: { status: string; duration: number; retry: number }[] = [];

  function processSuite(suite: PlaywrightSuite, filePath?: string) {
    const suiteFile = suite.file || filePath;

    for (const spec of suite.specifications || []) {
      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          const titlePath = [suite.title, spec.title].filter(Boolean) as string[];
          const stableKey = [
            suiteFile || "",
            ...titlePath,
            test.projectName || "",
          ].join("|");

          const testStatus = mapStatus(result.status || "unknown");
          const error = result.error
            ? {
                message: maskSecrets(result.error.message || ""),
                stack: result.error.stack
                  ? maskSecrets(result.error.stack)
                  : undefined,
              }
            : undefined;

          tests.push({
            testKey: stableKey,
            filePath: suiteFile || "",
            titlePath,
            projectName: test.projectName,
            status: testStatus,
            durationMs: result.duration || 0,
            retryCount: result.retry || 0,
            error,
            stdout: result.stdout
              ? maskSecrets(result.stdout.join("\n"))
              : undefined,
            stderr: result.stderr
              ? maskSecrets(result.stderr.join("\n"))
              : undefined,
            annotations: [],
            artifacts: [],
          });

          allResults.push({
            status: testStatus,
            duration: result.duration || 0,
            retry: result.retry || 0,
          });

          totalDurationMs += result.duration || 0;

          for (const attachment of result.attachments || []) {
            if (attachment.path && existsSync(attachment.path)) {
              const fileName = path.basename(attachment.path);
              const artifactKey = `${stableKey}-${attachment.name}`;
              const mimeType = attachment.contentType || guessMimeType(fileName);

              tests[tests.length - 1].artifacts.push({
                artifactKey,
                type: guessArtifactType(attachment.name, mimeType),
                fileName,
                mimeType,
                sizeBytes: 0,
              });

              artifactPaths.push({
                artifactKey,
                filePath: attachment.path,
                mimeType,
                type: guessArtifactType(attachment.name, mimeType),
              });
            }
          }
        }
      }
    }

    for (const child of suite.suites || []) {
      processSuite(child, suiteFile);
    }
  }

  for (const suite of report.suites || []) {
    processSuite(suite);
  }

  for (const ap of artifactPaths) {
    try {
      const s = await stat(ap.filePath);
      const test = tests.find((t) =>
        t.artifacts.some((a) => a.artifactKey === ap.artifactKey)
      );
      if (test) {
        const artifact = test.artifacts.find(
          (a) => a.artifactKey === ap.artifactKey
        );
        if (artifact) artifact.sizeBytes = s.size;
      }
    } catch {
      // File may have been cleaned up
    }
  }

  const gitInfo = getGitInfo();
  const sourceInfo = getSourceInfo();

  const total = allResults.length;
  const passed = allResults.filter((r) => r.status === "passed").length;
  const failed = allResults.filter((r) => r.status === "failed").length;
  const skipped = allResults.filter((r) => r.status === "skipped").length;
  const timedOut = allResults.filter((r) => r.status === "timed_out").length;
  const retries = allResults.reduce((sum, r) => sum + r.retry, 0);

  const runStatus = failed > 0 ? "failed" : timedOut > 0 ? "timed_out" : "passed";

  return {
    schemaVersion: SCHEMA_VERSION,
    source: {
      type: sourceInfo.type,
      cliVersion: "0.1.0",
      os: sourceInfo.os,
      nodeVersion: sourceInfo.nodeVersion,
      bunVersion: sourceInfo.bunVersion,
    },
    project: { environment },
    git: gitInfo,
    run: {
      startedAt,
      finishedAt,
      durationMs: totalDurationMs,
      status: runStatus,
    },
    summary: { total, passed, failed, skipped, timedOut, retries },
    tests,
  };
}

function mapStatus(status: string): CreateRunPayload["tests"][number]["status"] {
  switch (status) {
    case "passed":
      return "passed";
    case "failed":
      return "failed";
    case "skipped":
    case "pending":
      return "skipped";
    case "timedOut":
    case "timed_out":
      return "timed_out";
    case "interrupted":
      return "interrupted";
    default:
      return "unknown";
  }
}

function guessArtifactType(
  name: string,
  mimeType: string
): "screenshot" | "trace" | "video" | "stdout" | "stderr" | "attachment" {
  if (name.includes("screenshot") || mimeType.startsWith("image/"))
    return "screenshot";
  if (name.includes("trace") || name.endsWith(".zip")) return "trace";
  if (name.includes("video") || mimeType.startsWith("video/")) return "video";
  if (name === "stdout") return "stdout";
  if (name === "stderr") return "stderr";
  return "attachment";
}

function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".zip": "application/zip",
    ".json": "application/json",
    ".txt": "text/plain",
    ".html": "text/html",
    ".log": "text/plain",
  };
  return map[ext] || "application/octet-stream";
}

function getGitInfo() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const commitSha = execSync("git rev-parse HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const commitMessage = execSync("git log -1 --pretty=%B", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    return { branch, commitSha, commitMessage, remoteUrl };
  } catch {
    return undefined;
  }
}

function getSourceInfo() {
  const isCI = !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.JENKINS_URL
  );

  return {
    type: (isCI ? "ci" : "local") as "local" | "ci",
    os: process.platform,
    nodeVersion: process.version,
    bunVersion: typeof Bun !== "undefined" ? Bun.version : undefined,
  };
}
