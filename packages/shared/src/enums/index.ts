// Shared enums — used by web app, CLI, and shared schemas

export const RUN_STATUSES = [
  "passed",
  "failed",
  "timed_out",
  "cancelled",
  "upload_failed",
  "unknown",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const TEST_STATUSES = [
  "passed",
  "failed",
  "skipped",
  "timed_out",
  "interrupted",
  "flaky",
  "unknown",
] as const;
export type TestStatus = (typeof TEST_STATUSES)[number];

export const ARTIFACT_TYPES = [
  "screenshot",
  "trace",
  "video",
  "stdout",
  "stderr",
  "attachment",
] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const ENVIRONMENTS = ["local", "staging", "production"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const SOURCE_TYPES = ["local", "ci"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const FLAKE_CLASSIFICATIONS = [
  "stable",
  "watch",
  "flaky",
  "regression",
] as const;
export type FlakeClassification = (typeof FLAKE_CLASSIFICATIONS)[number];

export const SCHEMA_VERSION = "2026-01" as const;

export const CAPTURE_MODES = ["off", "failure-only", "always"] as const;
export type CaptureMode = (typeof CAPTURE_MODES)[number];

// Limits (per SPEC section 8.3)
export const LIMITS = {
  MAX_ARTIFACT_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_TOTAL_ARTIFACT_SIZE_PER_RUN: 500 * 1024 * 1024, // 500MB
  MAX_ARTIFACTS_PER_RUN: 500,
  MAX_ERROR_TEXT_PER_TEST: 50 * 1024, // 50KB
  MAX_STDOUT_PER_TEST: 50 * 1024, // 50KB
  MAX_STDERR_PER_TEST: 50 * 1024, // 50KB
  ARTIFACT_RETENTION_DAYS: 14,
  SIGNED_URL_EXPIRY_MINUTES: 10,
  ALERT_DEDUPE_WINDOW_MINUTES: 10,
  FLAKE_WINDOW_SIZE: 20,
} as const;

// Token prefix
export const TOKEN_PREFIX = "pst_";
