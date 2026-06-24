// Zod schemas for ingestion data contracts (SPEC section 6)

import { z } from "zod";
import { SCHEMA_VERSION, LIMITS } from "../enums";

// ============================================================
// Ingestion payload schemas
// ============================================================

export const schemaVersionSchema = z.literal(SCHEMA_VERSION);

export const sourceSchema = z.object({
  type: z.enum(["local", "ci"]),
  cliVersion: z.string().optional(),
  os: z.string().optional(),
  nodeVersion: z.string().optional(),
  bunVersion: z.string().optional(),
});

export const gitInfoSchema = z.object({
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  commitMessage: z.string().optional(),
  remoteUrl: z.string().optional(),
});

export const runSummarySchema = z.object({
  total: z.number().int().min(0),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  skipped: z.number().int().min(0),
  timedOut: z.number().int().min(0),
  retries: z.number().int().min(0),
});

export const artifactInputSchema = z.object({
  artifactKey: z.string(),
  type: z.enum([
    "screenshot",
    "trace",
    "video",
    "stdout",
    "stderr",
    "attachment",
  ]),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
});

export const testInputSchema = z.object({
  testKey: z.string(),
  filePath: z.string(),
  titlePath: z.array(z.string()),
  projectName: z.string().optional(),
  status: z.enum([
    "passed",
    "failed",
    "skipped",
    "timed_out",
    "interrupted",
    "flaky",
    "unknown",
  ]),
  durationMs: z.number().int().min(0),
  retryCount: z.number().int().min(0).default(0),
  error: z
    .object({
      message: z.string().max(LIMITS.MAX_ERROR_TEXT_PER_TEST).optional(),
      stack: z.string().max(LIMITS.MAX_ERROR_TEXT_PER_TEST).optional(),
    })
    .optional(),
  stdout: z.string().max(LIMITS.MAX_STDOUT_PER_TEST).optional(),
  stderr: z.string().max(LIMITS.MAX_STDERR_PER_TEST).optional(),
  annotations: z.array(z.any()).default([]),
  artifacts: z.array(artifactInputSchema).default([]),
});

// POST /ingest/runs payload
export const createRunPayloadSchema = z.object({
  schemaVersion: schemaVersionSchema,
  source: sourceSchema,
  project: z.object({
    environment: z.string(),
  }),
  git: gitInfoSchema.optional(),
  run: z.object({
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime().optional(),
    durationMs: z.number().int().min(0).optional(),
    status: z.enum([
      "passed",
      "failed",
      "timed_out",
      "cancelled",
      "unknown",
    ]),
  }),
  summary: runSummarySchema,
  tests: z.array(testInputSchema),
});

export type CreateRunPayload = z.infer<typeof createRunPayloadSchema>;
export type TestInput = z.infer<typeof testInputSchema>;
export type ArtifactInput = z.infer<typeof artifactInputSchema>;

// ============================================================
// Ingestion response schemas
// ============================================================

export const artifactUploadInfoSchema = z.object({
  artifactKey: z.string(),
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  expiresAt: z.string().datetime(),
});

export const createRunResponseSchema = z.object({
  runId: z.string(),
  runUrl: z.string().url(),
  artifactUploads: z.array(artifactUploadInfoSchema),
});

export type CreateRunResponse = z.infer<typeof createRunResponseSchema>;

// POST /ingest/runs/{runId}/finalise
export const finaliseRunPayloadSchema = z.object({
  uploadedArtifacts: z.array(
    z.object({
      artifactKey: z.string(),
      storageKey: z.string(),
      uploaded: z.boolean(),
    })
  ),
});

export const finaliseRunResponseSchema = z.object({
  ok: z.boolean(),
  runUrl: z.string().url(),
});

// POST /ingest/validate-token
export const validateTokenResponseSchema = z.object({
  valid: z.boolean(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  orgSlug: z.string().optional(),
  environments: z.array(z.string()).optional(),
});

export type ValidateTokenResponse = z.infer<
  typeof validateTokenResponseSchema
>;

// ============================================================
// CLI config schema
// ============================================================

export const cliConfigSchema = z.object({
  apiUrl: z.string().url(),
  projectToken: z.string(),
  defaultEnvironment: z.enum(["local", "staging", "production"]).default("local"),
  capture: z
    .object({
      screenshots: z.enum(["off", "failure-only", "always"]).default("failure-only"),
      traces: z.enum(["off", "failure-only", "always"]).default("failure-only"),
      videos: z.enum(["off", "failure-only", "always"]).default("off"),
    })
    .default({
      screenshots: "failure-only",
      traces: "failure-only",
      videos: "off",
    }),
});

export type CliConfig = z.infer<typeof cliConfigSchema>;
