# SPEC.md — Playwright Testing Studio

## 1. Product Summary

### 1.1 Product Definition

Playwright Testing Studio is a front-facing SaaS web application with a companion CLI that lets developers run Playwright tests locally or in CI, sync test results into a cloud dashboard, and visually monitor failures, traces, screenshots, flakiness, trends, and alerts.

The product is designed to feel like a modern “studio” for Playwright: a clean, project-based UI where users can sign in, create projects, connect their test suite through a CLI, and view every test run in one place.

### 1.2 Core Promise

Run Playwright tests as usual, but stop digging through terminal output and CI logs. Every run syncs into a clean dashboard where failures, traces, screenshots, retry behaviour, flaky tests, and health trends are easy to understand.

### 1.3 Founder-Level Positioning

A Playwright-first testing intelligence platform for solo developers and small teams who want a visual, synced, actionable testing dashboard without building their own reporting system.

### 1.4 Initial Target User

The first target user is a solo founder/developer actively building Next.js or modern web applications and using Playwright for end-to-end testing.

The product should later expand naturally to small teams, agencies, and SaaS engineering teams.

---

## 2. Product Scope

### 2.1 MVP Objective

Build a working SaaS product where a user can:

1. Sign up and log in.
2. Create a project.
3. Generate a project token.
4. Install and configure the CLI in a Playwright project.
5. Run tests locally or in CI.
6. Sync results and artefacts to the web app.
7. View runs, failures, screenshots, traces, flaky tests, and alerts in a polished UI.

### 2.2 In Scope for MVP

- SaaS web app
- User authentication
- Organisation/workspace model
- Project creation
- Project tokens for CLI ingestion
- Environment support: local, staging, production
- Bun-based TypeScript CLI
- Playwright test execution wrapper
- Upload of Playwright JSON results
- Upload of failure screenshots
- Upload of Playwright traces
- Run dashboard
- Run details page
- Failed test details page
- Test history
- Basic flakiness detection
- Slack alerting
- Usage tracking
- Secure artefact storage
- Multi-tenant data isolation

### 2.3 Out of Scope for MVP

- Desktop application
- Tauri/Electron wrapper
- Cloud-hosted Playwright runners
- Browser region monitoring
- GitHub App that reads source code
- Repository cloning
- Visual regression diffing
- AI failure explanations
- Enterprise SSO/SAML
- Advanced billing automation
- Mobile app testing
- Self-hosted runners
- Advanced RBAC beyond Owner and Viewer

---

## 3. Product Architecture

### 3.1 System Components

The product has four main components:

1. Web App
2. API/Ingestion Backend
3. CLI
4. Database and Artefact Storage

### 3.2 Recommended Stack

#### Web App

- Framework: Next.js App Router
- Language: TypeScript
- Runtime: Node.js
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Forms: React Hook Form + Zod
- Tables: TanStack Table
- Charts: Recharts or Tremor-style chart components
- Deployment: Vercel or equivalent Node-compatible hosting

#### Auth and Database

- Auth: Supabase Auth
- Database: Supabase Postgres
- Tenancy: Row Level Security
- ORM/query layer: Drizzle ORM or Supabase client with typed queries
- Migrations: Drizzle Kit or Supabase migrations

#### Storage

- Storage: Cloudflare R2 or S3-compatible object storage
- Usage: Playwright traces, screenshots, optional videos
- Access: signed upload URLs and signed read URLs

#### CLI

- Runtime/toolchain: Bun + TypeScript
- CLI framework: Commander
- Build output: npm package
- Execution model: CLI can be run locally or inside CI
- Playwright execution: default to Node-compatible Playwright command for reliability

#### Background Jobs

MVP can process ingestion synchronously where reasonable. Add queueing once ingestion grows.

Recommended queue option:

- Upstash Redis + QStash, or
- Supabase-compatible background job system

Use background jobs later for:

- flake aggregation
- alert dispatch
- usage calculation
- artefact cleanup
- retention enforcement

---

## 4. Product UX

### 4.1 Main User Flow

1. User signs up.
2. User creates a workspace.
3. User creates a project.
4. System generates a project token.
5. User installs CLI in their Playwright project.
6. User runs CLI setup.
7. User runs tests through CLI.
8. CLI uploads run results and artefacts.
9. Web app shows the run.
10. User opens the failure and sees error, screenshot, and trace.

### 4.2 Setup Flow

#### Web App

- Create account
- Create project
- Copy setup command
- Copy project token or use token-based init

#### CLI

```bash
bunx playwright-studio init
```

The CLI prompts for:

- Project token
- Default environment: local/staging/production
- Optional project name for local display

Then:

```bash
bunx playwright-studio test
```

The CLI runs Playwright, collects results, uploads them, and prints a run URL.

Example final CLI output:

```bash
Tests completed with 2 failures.
Run synced: https://app.example.com/projects/my-app/runs/run_123
```

### 4.3 Debug Flow

The core UX rule is:

A user must be able to go from dashboard to failing trace in two clicks.

Dashboard → Failed Run → Failed Test / Trace

### 4.4 Web App Navigation

Primary navigation:

- Dashboard
- Projects
- Runs
- Tests
- Flaky Tests
- Alerts
- Settings

### 4.5 Key Screens

#### 4.5.1 Dashboard

Purpose: show the user what needs attention.

Must show:

- Project status cards
- Latest run status
- Failed runs
- Flaky tests count
- Slowest tests
- Recent alerts

#### 4.5.2 Projects Page

Must show:

- List of projects
- Last run status
- Failure count
- Flake count
- Environment badges
- Create project button

#### 4.5.3 Project Overview Page

Must show:

- Latest run
- Run trend
- Failure rate
- Flake rate
- Slowest tests
- Recent failures
- Setup status

#### 4.5.4 Runs List Page

Filters:

- Status: passed, failed, timed out, cancelled
- Environment
- Branch
- Commit
- Date range
- Trigger source: local or CI

Columns:

- Status
- Environment
- Branch
- Commit
- Started at
- Duration
- Passed
- Failed
- Skipped
- Trigger source

#### 4.5.5 Run Detail Page

Must show:

- Run summary
- Metadata: branch, commit, environment, duration
- Test result breakdown
- Failed tests first
- Retry information
- Artefacts
- Direct trace links

#### 4.5.6 Test Detail Page

Must show:

- Test name
- File path
- Status in current run
- Error message
- Stack trace
- Duration
- Retry count
- Screenshot
- Trace
- History across previous runs
- Flakiness badge

#### 4.5.7 Flaky Tests Page

Must show:

- Ranked flaky tests
- Flake score
- Pass/fail pattern
- Last failure
- File path
- Recent history
- Suggested action label:
  - investigate
  - quarantine candidate
  - stable now

#### 4.5.8 Alerts Settings Page

Must support:

- Slack webhook setup
- Test alert
- Enable/disable alerts
- Alert rules:
  - failed production run
  - new failing test
  - failure spike
  - flaky test spike

#### 4.5.9 Project Settings Page

Must support:

- Project name
- Environments
- Project token generation
- Token rotation
- Token revocation
- Usage overview
- Artefact retention settings, if exposed

---

## 5. CLI Specification

### 5.1 CLI Purpose

The CLI connects a Playwright test project to the SaaS platform. It runs tests, collects reports and artefacts, uploads them securely, and returns a web dashboard URL.

The CLI should be simple, reliable, and developer-friendly.

### 5.2 CLI Stack

- Bun + TypeScript
- Commander for command structure
- Zod for local config validation
- Native fetch or undici-compatible HTTP client
- FormData or signed URL upload for artefacts

### 5.3 CLI Package Name

Temporary package name:

```bash
playwright-studio
```

Final naming can be changed before public release.

### 5.4 CLI Commands

#### 5.4.1 `init`

```bash
bunx playwright-studio init
```

Purpose:

- Link current repository to a project.
- Validate project token.
- Save local config.

Config file location:

```bash
.playwright-studio/config.json
```

This file should be gitignored by default if it contains sensitive tokens.

Recommended generated `.gitignore` entry:

```bash
.playwright-studio/config.json
```

Alternative CI-safe approach:

- Use environment variables instead of storing tokens in repo.

Supported env vars:

```bash
PLAYWRIGHT_STUDIO_TOKEN=
PLAYWRIGHT_STUDIO_ENV=
PLAYWRIGHT_STUDIO_API_URL=
```

#### 5.4.2 `test`

```bash
bunx playwright-studio test
```

Purpose:

- Run Playwright tests.
- Generate JSON report.
- Collect artefacts.
- Upload run.
- Print dashboard URL.

Default internal command:

```bash
npx playwright test --reporter=json
```

The CLI should support passing through Playwright arguments:

```bash
bunx playwright-studio test --project=chromium --grep="checkout"
```

#### 5.4.3 `upload`

```bash
bunx playwright-studio upload ./playwright-report/results.json
```

Purpose:

- Upload an existing Playwright JSON report.
- Useful for CI pipelines that run Playwright separately.

#### 5.4.4 `doctor`

```bash
bunx playwright-studio doctor
```

Purpose:

- Validate config.
- Validate token.
- Check Playwright installation.
- Check artefact paths.
- Check API connectivity.

#### 5.4.5 `logout` or `unlink`

```bash
bunx playwright-studio unlink
```

Purpose:

- Remove local project connection.

### 5.5 CLI Configuration

Local config shape:

```json
{
  "apiUrl": "https://api.example.com",
  "projectToken": "pst_xxxxxxxxx",
  "defaultEnvironment": "local",
  "capture": {
    "screenshots": "failure-only",
    "traces": "failure-only",
    "videos": "off"
  }
}
```

### 5.6 CLI Behaviour

The CLI should:

- Never require user password.
- Use project token only.
- Mask tokens in output.
- Upload only what is needed.
- Fail gracefully if upload fails.
- Always preserve local test result behaviour.
- Print local Playwright failure output normally.
- Print web dashboard URL after successful sync.

### 5.7 CLI Exit Codes

The CLI must preserve Playwright exit semantics:

- If tests fail, CLI exits with non-zero.
- If tests pass and upload succeeds, exit zero.
- If tests pass but upload fails, decide via flag:
  - default: warn but do not fail local dev
  - CI mode: fail if upload fails

Suggested flag:

```bash
--require-upload
```

### 5.8 CI Usage

GitHub Actions example:

```yaml
name: Playwright Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bunx playwright-studio test --env=ci --require-upload
        env:
          PLAYWRIGHT_STUDIO_TOKEN: ${{ secrets.PLAYWRIGHT_STUDIO_TOKEN }}
          PLAYWRIGHT_STUDIO_ENV: staging
```

---

## 6. Data Contract Specification

### 6.1 Contract Versioning

All ingestion payloads must include:

```json
{
  "schemaVersion": "2026-01"
}
```

The API must reject unsupported versions with a clear error.

### 6.2 Run Create Payload

Endpoint:

```http
POST /ingest/runs
```

Authentication:

```http
Authorization: Bearer <project_token>
```

Payload:

```json
{
  "schemaVersion": "2026-01",
  "source": {
    "type": "local",
    "cliVersion": "0.1.0",
    "os": "darwin",
    "nodeVersion": "22.x",
    "bunVersion": "1.x"
  },
  "project": {
    "environment": "local"
  },
  "git": {
    "branch": "main",
    "commitSha": "abc123",
    "commitMessage": "Fix checkout flow",
    "remoteUrl": "git@github.com:org/repo.git"
  },
  "run": {
    "startedAt": "2026-06-20T12:00:00.000Z",
    "finishedAt": "2026-06-20T12:01:30.000Z",
    "durationMs": 90000,
    "status": "failed"
  },
  "summary": {
    "total": 120,
    "passed": 115,
    "failed": 2,
    "skipped": 3,
    "timedOut": 0,
    "retries": 1
  },
  "tests": [
    {
      "testKey": "tests/checkout.spec.ts::Checkout::should complete payment",
      "filePath": "tests/checkout.spec.ts",
      "titlePath": ["Checkout", "should complete payment"],
      "projectName": "chromium",
      "status": "failed",
      "durationMs": 4200,
      "retryCount": 1,
      "error": {
        "message": "Expected locator to be visible",
        "stack": "Error: Expected locator..."
      },
      "stdout": "",
      "stderr": "",
      "annotations": [],
      "artifacts": [
        {
          "artifactKey": "trace-checkout-payment",
          "type": "trace",
          "fileName": "trace.zip",
          "mimeType": "application/zip",
          "sizeBytes": 4000000
        },
        {
          "artifactKey": "screenshot-checkout-payment",
          "type": "screenshot",
          "fileName": "failure.png",
          "mimeType": "image/png",
          "sizeBytes": 900000
        }
      ]
    }
  ]
}
```

### 6.3 Run Create Response

```json
{
  "runId": "run_123",
  "runUrl": "https://app.example.com/projects/proj_123/runs/run_123",
  "artifactUploads": [
    {
      "artifactKey": "trace-checkout-payment",
      "uploadUrl": "https://r2.example.com/signed-upload-url",
      "storageKey": "org_123/proj_123/run_123/trace.zip",
      "expiresAt": "2026-06-20T12:10:00.000Z"
    }
  ]
}
```

### 6.4 Finalise Run Endpoint

```http
POST /ingest/runs/{runId}/finalise
```

Payload:

```json
{
  "uploadedArtifacts": [
    {
      "artifactKey": "trace-checkout-payment",
      "storageKey": "org_123/proj_123/run_123/trace.zip",
      "uploaded": true
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "runUrl": "https://app.example.com/projects/proj_123/runs/run_123"
}
```

### 6.5 Test Identity

Canonical test identity:

```text
project_id + file_path + title_path + browser_project_name
```

This allows the system to track the same test over time.

### 6.6 Status Values

Run status:

- passed
- failed
- timed_out
- cancelled
- upload_failed
- unknown

Test status:

- passed
- failed
- skipped
- timed_out
- interrupted
- flaky
- unknown

Artefact type:

- screenshot
- trace
- video
- stdout
- stderr
- attachment

---

## 7. Database Specification

### 7.1 Tables

#### users

Managed by Supabase Auth.

#### orgs

Fields:

- id
- name
- slug
- created_at
- updated_at

#### org_members

Fields:

- id
- org_id
- user_id
- role: owner/viewer
- created_at

#### projects

Fields:

- id
- org_id
- name
- slug
- created_at
- updated_at
- archived_at

#### project_tokens

Fields:

- id
- project_id
- name
- token_hash
- last_used_at
- created_at
- revoked_at

#### environments

Fields:

- id
- project_id
- name
- slug
- created_at

Default environments:

- local
- staging
- production

#### runs

Fields:

- id
- project_id
- environment_id
- status
- source_type
- cli_version
- branch
- commit_sha
- commit_message
- remote_url_hash
- started_at
- finished_at
- duration_ms
- total_count
- passed_count
- failed_count
- skipped_count
- timed_out_count
- retry_count
- created_at

#### tests

Fields:

- id
- project_id
- file_path
- title_path
- browser_project_name
- stable_key
- created_at
- updated_at

#### test_results

Fields:

- id
- run_id
- test_id
- status
- duration_ms
- retry_count
- error_message
- error_stack
- stdout
- stderr
- created_at

#### artifacts

Fields:

- id
- run_id
- test_result_id
- artifact_key
- type
- storage_key
- file_name
- mime_type
- size_bytes
- uploaded
- created_at
- expires_at

#### flaky_test_stats

Fields:

- id
- project_id
- test_id
- window_size
- pass_count
- fail_count
- retry_pass_count
- flake_score
- classification
- calculated_at

#### alerts

Fields:

- id
- project_id
- provider
- enabled
- encrypted_webhook_url
- rules
- created_at
- updated_at

#### alert_events

Fields:

- id
- project_id
- run_id
- alert_id
- dedupe_key
- status
- sent_at
- error
- created_at

#### usage_counters

Fields:

- id
- org_id
- project_id
- month
- runs_count
- artifact_bytes
- created_at
- updated_at

### 7.2 Indexes

Required indexes:

```sql
runs(project_id, started_at desc);
runs(project_id, environment_id, started_at desc);
runs(project_id, status, started_at desc);
tests(project_id, stable_key);
test_results(run_id, status);
test_results(test_id, created_at);
artifacts(run_id);
artifacts(test_result_id);
flaky_test_stats(project_id, flake_score desc);
usage_counters(org_id, month);
```

### 7.3 Tenancy Rules

Every business entity must be scoped through:

```text
org -> project -> run/test/artifact
```

Users can only access projects through org membership.

Project tokens can only ingest data into their assigned project.

---

## 8. Artefact Policy

### 8.1 Default Capture Rules

MVP default:

- Screenshots: failure only
- Traces: failure only
- Videos: off

### 8.2 Recommended Playwright Config Guidance

The product should suggest this config:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  reporter: [['json', { outputFile: 'playwright-studio-results.json' }]]
});
```

### 8.3 Upload Limits

MVP safety limits:

- Max artefact file size: 50MB
- Max total artefact size per run: 500MB
- Max artefacts per run: 500
- Max error text stored per test: 50KB
- Max stdout/stderr per test: 50KB each

### 8.4 Retention

MVP default:

- Artefacts retained for 14 days
- Run metadata retained indefinitely for now
- Future paid plans can increase artefact retention

### 8.5 Storage Access

- Uploads use short-lived signed upload URLs.
- Reads use short-lived signed read URLs.
- Raw object URLs must not be public.
- Artefacts must not be accessible without authorisation.

---

## 9. Flakiness Detection

### 9.1 MVP Classification

A test is considered flaky when either:

1. It fails and then passes on retry in the same run.
2. It has both pass and fail outcomes within the last 20 completed runs.
3. It failed previously, passed later without code change, and then fails again in a short window.

### 9.2 Flake Score

Initial formula:

```text
flake_score = 
  (retry_pass_count * 0.5) +
  (status_flip_count * 0.3) +
  (recent_fail_pass_mix * 0.2)
```

Score range:

- 0.0 to 0.3: stable
- 0.3 to 0.6: watch
- 0.6 to 1.0: flaky

### 9.3 UI Labels

- Stable
- Watch
- Likely flaky
- Likely regression

### 9.4 Regression Detection

A failure is likely a regression if:

- the test passed in the previous 5 runs, and
- this run failed, and
- no retry passed, and
- the failure appears on the main or production branch/environment.

---

## 10. Alerts Specification

### 10.1 MVP Provider

Slack Incoming Webhook only.

### 10.2 Alert Rules

MVP rules:

1. Failed production run
2. New failing test
3. Failure spike
4. Flaky test spike

### 10.3 Slack Message Content

The Slack alert must include:

- Project name
- Environment
- Run status
- Branch
- Commit SHA
- Number passed/failed
- Top failing tests
- Run URL

Example:

```text
Playwright run failed in production

Project: My Next App
Branch: main
Commit: abc123
Failed: 2 / 120

Top failures:
- Checkout should complete payment
- Login should redirect after success

Open run: https://app.example.com/projects/my-app/runs/run_123
```

### 10.4 Deduplication

Deduplicate alerts using:

```text
project_id + environment + branch + failing_test_stable_keys
```

Deduplication window:

- 10 minutes

---

## 11. Security Specification

### 11.1 Authentication

- Users authenticate through Supabase Auth.
- Project tokens are used only for ingestion.
- Project tokens must never grant read access.

### 11.2 Token Storage

- Store only token hash in database.
- Show token only once when created.
- Support rotation and revocation.

### 11.3 RLS

Enable Row Level Security on all tenant-owned tables.

Users may access records only if they are members of the owning org.

### 11.4 Artefact Security

- No public buckets.
- Signed upload URLs only.
- Signed read URLs only.
- Expiring URLs.
- Authorisation checked before URL generation.

### 11.5 Secret Masking

CLI should mask common secret patterns before uploading logs:

- API keys
- Bearer tokens
- Basic auth strings
- `.env` style key-value secrets
- GitHub tokens
- Supabase keys where possible

### 11.6 Rate Limiting

MVP rate limits:

- Token validation: limited per IP/token
- Run ingestion: per project per minute
- Artefact URL generation: per run

### 11.7 Abuse Prevention

- Enforce max payload size.
- Enforce artefact size caps.
- Reject unsupported file types.
- Reject invalid schema version.
- Prevent token reuse across projects.

---

## 12. API Specification

### 12.1 Public Web App API

#### Create Project

```http
POST /api/projects
```

#### List Projects

```http
GET /api/projects
```

#### Get Project

```http
GET /api/projects/{projectId}
```

#### Create Project Token

```http
POST /api/projects/{projectId}/tokens
```

#### Rotate Project Token

```http
POST /api/projects/{projectId}/tokens/{tokenId}/rotate
```

#### Revoke Project Token

```http
DELETE /api/projects/{projectId}/tokens/{tokenId}
```

#### List Runs

```http
GET /api/projects/{projectId}/runs
```

Query filters:

- status
- environment
- branch
- from
- to
- page
- limit

#### Get Run

```http
GET /api/runs/{runId}
```

#### Get Run Tests

```http
GET /api/runs/{runId}/tests
```

#### Get Test History

```http
GET /api/tests/{testId}/history
```

#### Get Artefact URL

```http
POST /api/artifacts/{artifactId}/signed-url
```

### 12.2 Ingestion API

#### Validate Token

```http
POST /ingest/validate-token
```

#### Create Run

```http
POST /ingest/runs
```

#### Finalise Run

```http
POST /ingest/runs/{runId}/finalise
```

#### Mark Run Upload Failed

```http
POST /ingest/runs/{runId}/upload-failed
```

---

## 13. Performance Requirements

### 13.1 Product Performance

- Dashboard should load within 2 seconds for normal projects.
- Runs list should paginate.
- Run detail page should load metadata quickly before artefacts.
- Artefacts should be lazy-loaded.
- Screenshots should use thumbnails where possible.

### 13.2 Ingestion Performance

Target MVP:

- Standard run should appear in dashboard within 10 seconds after CLI upload.
- API should support at least 1000 test results per run in MVP.
- Large artefacts must upload directly to storage, not through the app server.

### 13.3 Pagination

All large lists must be paginated:

- Projects
- Runs
- Tests
- Artefacts
- Alert events

---

## 14. Usage and Billing Readiness

Billing does not need to be fully automated in MVP, but usage must be tracked from day one.

### 14.1 Track

- Runs per month
- Total tests per month
- Artefact storage used
- Artefact bandwidth, if available
- Project count
- User count

### 14.2 Future Pricing Dimensions

Possible pricing:

- per project
- per monthly test run
- per artefact retention period
- per team seat
- per alert destination

### 14.3 MVP Usage UI

Project settings should show:

- runs this month
- storage used
- current retention period
- approximate limits

---

## 15. Product Quality Rules

### 15.1 UX Rules

- Failure investigation must be fast.
- Failed tests always appear first.
- Error messages must be readable.
- Trace links must be obvious.
- Empty states must guide setup.
- CLI output must always give a useful next action.

### 15.2 Reliability Rules

- Upload failures should not corrupt runs.
- Partial artefact uploads should be visible.
- Run status should show if upload is incomplete.
- Failed ingestion should provide clear CLI error output.
- Schema validation errors should be readable.

### 15.3 Developer Experience Rules

- Setup should take under 5 minutes.
- CLI command should work in local and CI.
- Token errors should be obvious.
- Docs should include copy-paste setup commands.
- Product should not require repo access.

---

## 16. Build Milestones

### Milestone 1 — Core SaaS Foundation

Deliver:

- Auth
- Workspace/org model
- Project creation
- Project token creation
- Basic dashboard shell

Acceptance:

- User can sign up, create a project, and copy a token.

### Milestone 2 — CLI and Ingestion

Deliver:

- Bun CLI
- `init`
- `test`
- `upload`
- `/ingest/runs`
- run creation in DB

Acceptance:

- User can run tests locally and see synced run metadata in dashboard.

### Milestone 3 — Results UI

Deliver:

- Runs list
- Run detail page
- Failed test detail
- Test result storage

Acceptance:

- User can inspect failed tests from dashboard.

### Milestone 4 — Artefacts

Deliver:

- signed upload URLs
- screenshot upload
- trace upload
- signed read URLs
- artefact display in UI

Acceptance:

- Failing test shows screenshot and trace link.

### Milestone 5 — Flakiness Intelligence

Deliver:

- test identity tracking
- history per test
- flake score
- flaky tests page
- regression labels

Acceptance:

- System identifies retry-based and history-based flaky tests.

### Milestone 6 — Alerts and Usage

Deliver:

- Slack webhook integration
- alert rules
- usage counters
- basic rate limits

Acceptance:

- Production failed run sends Slack alert.
- Project usage appears in settings.

---

## 17. MVP Acceptance Criteria

The MVP is complete when:

1. A user can sign up and create a project.
2. A project token can be created, rotated, and revoked.
3. The CLI can be configured with that token.
4. The CLI can run Playwright tests locally.
5. Results sync to the web app.
6. Failed tests show error details.
7. Screenshots and traces upload and open from the UI.
8. Runs can be filtered by branch, environment, status, and date.
9. Flaky tests are identified using retry and history rules.
10. Slack alerts work for failed production runs.
11. Usage counters exist for runs and artefact storage.
12. Tenant data is isolated through RLS and project scoping.

---

## 18. Recommended Repository Structure

### Monorepo

Use a monorepo.

Recommended tool:

- Turborepo or plain Bun workspaces

Structure:

```text
apps/
  web/
    Next.js web app and API routes

packages/
  cli/
    Bun + TypeScript CLI

  shared/
    shared types, schemas, constants

  db/
    database schema and migrations

  eslint-config/
    shared lint config

  tsconfig/
    shared TS config
```

### Shared Package

The shared package must include:

- ingestion payload schemas
- status enums
- artefact type enums
- API response types
- validation helpers

This avoids CLI and backend schema drift.

---

## 19. Documentation Required Before Development

Only create the real docs that prevent rework.

### 19.1 MVP Scope Contract

A one-page document defining:

- exactly what is in MVP
- exactly what is out
- release criteria
- non-negotiables

### 19.2 Data Contract Spec

The most important engineering document.

Must define:

- ingestion payload JSON
- response JSON
- artefact manifest
- schema versioning
- status values
- field types
- limits
- error responses

### 19.3 CLI Spec

Must define:

- commands
- config
- environment variables
- output format
- exit codes
- CI examples
- upload flow

### 19.4 DB Schema and Index Plan

Must define:

- tables
- key columns
- relationships
- indexes
- RLS rules

### 19.5 System Design

Must include:

- web app
- API
- DB
- object storage
- CLI
- ingestion flow
- signed URL flow
- alert flow

### 19.6 Artefact and Retention Policy

Must define:

- what is captured
- when it is captured
- size limits
- retention
- storage access
- cleanup policy

### 19.7 Security and Tenancy Rules

Must define:

- user auth
- project token auth
- token hashing
- org membership
- RLS
- signed URLs
- log masking
- rate limiting

These seven documents are enough. Do not create unnecessary user research or generic planning documents before development.

---

## 20. Engineering Notes

### 20.1 Why Web App + CLI

This product should be SaaS-first because users need to log in, see synced test history, manage projects, and later invite teams.

The CLI is the bridge between their local/CI test runs and the platform.

### 20.2 Why Not Desktop

A desktop app is not part of current scope. It adds packaging, auto-update, OS permissions, and sync complexity without being necessary for the MVP.

### 20.3 Why Bun for CLI

Bun gives fast development, simple TypeScript execution, and modern package tooling.

However, Playwright itself is safest when executed using its standard Node-compatible command. Therefore, the CLI can be built with Bun while executing Playwright in a compatibility-safe way.

### 20.4 Why Store Artefacts Outside DB

Screenshots, traces, and videos are large and expensive to store in a database. They must be stored in object storage with only metadata stored in Postgres.

### 20.5 Why Project Tokens

Project tokens allow CI and local machines to upload results without needing a full user session. This is safer, easier to automate, and standard for developer tools.

---

## 21. Future V1/V2 Expansion

Do not build these in MVP, but keep architecture ready.

### V1

- GitHub Actions helper
- GitHub commit and PR linking
- Email alerts
- Better flake trend graphs
- Team invitations
- Billing integration
- Public status badges
- Test quarantine labels
- Export reports

### V2

- Hosted scheduled runners
- Regional browser monitoring
- Visual regression
- AI failure summaries
- SSO/SAML
- Advanced RBAC
- Self-hosted runners
- Webhook API
- Linear/Jira issue creation
- Test ownership mapping

---

## 22. Final Product Principle

The product must not become a generic test management platform.

It must stay sharply focused on Playwright testing, fast debugging, synced visibility, flakiness intelligence, and simple monitoring.

If a feature does not help a developer understand or act on a Playwright test failure faster, it should not enter the MVP.
