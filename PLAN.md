# Trace8 — Playwright Testing Studio

**Run Playwright tests as usual. Stop digging through terminal output.** Every run syncs into a clean dashboard where failures, traces, screenshots, retry behaviour, flaky tests, and health trends are easy to understand.

---

## Product Identity

**Name:** Trace8 — Playwright Testing Studio
**Positioning:** A Playwright-first testing intelligence platform for solo developers and small teams who want a visual, synced, actionable testing dashboard without building their own reporting system.
**License:** Proprietary (Codezela Technologies)

---

## Tech Stack

### Web App
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 16.x (App Router) | Latest, RSC, edge-ready |
| Runtime | Node.js 24 | Bun for dev/scripts, Node for prod stability |
| Language | TypeScript (strict) | Type safety end-to-end |
| Styling | Tailwind CSS v4 | Latest, CSS-first config |
| UI Components | shadcn/ui (Radix) | Proven, accessible, customizable |
| Animation | Motion (framer-motion) | Spring physics, layout animations |
| Forms | React Hook Form + Zod | Type-safe validation |
| Tables | TanStack Table v8 | Sortable, filterable, paginated |
| Charts | Recharts | Test trends, flakiness visualization |
| ORM | Prisma 7 + @prisma/adapter-pg | Type-safe DB, driver adapter |
| Database | PostgreSQL (Neon for prod, local for dev) | Serverless-ready |
| Auth | Auth.js v5 (NextAuth) | Credentials provider + extensible |
| Storage | R2/S3-compatible (local for dev) | Signed URLs, secure artefacts |
| Testing | Vitest + Playwright | Unit + E2E |
| Package Manager | Bun (workspaces) | Fast, native workspace support |

### CLI
| Component | Choice |
|-----------|--------|
| Runtime | Bun |
| Language | TypeScript |
| Framework | Commander |
| Validation | Zod |
| HTTP | Native fetch |
| Package Name | `playwright-studio` |

---

## Theme System: "Signal"

A dark-first developer tool aesthetic with an electric chartreuse accent that evokes "signal", "go", "active". Unique — not the typical SaaS blue/purple/teal.

### Color Palette (Dark Mode — Primary)
```
--background:    oklch(0.14 0.01 260)     /* deep midnight */
--surface:       oklch(0.18 0.012 260)    /* elevated surface */
--surface-2:     oklch(0.22 0.014 260)    /* cards, inputs */
--border:        oklch(0.28 0.015 260)    /* subtle borders */

--primary:       oklch(0.82 0.21 128)     /* electric chartreuse */
--primary-hover: oklch(0.78 0.22 128)
--primary-fg:    oklch(0.14 0.01 260)     /* dark text on chartreuse */

--accent:        oklch(0.72 0.18 220)     /* electric cyan */
--accent-2:      oklch(0.65 0.25 290)     /* violet for interactive */

--success:       oklch(0.70 0.19 155)     /* emerald — passed */
--danger:        oklch(0.63 0.24 18)      /* rose — failed */
--warning:       oklch(0.75 0.18 75)      /* amber — flaky/watch */
--info:          oklch(0.70 0.15 240)     /* blue */

--text:          oklch(0.96 0.005 260)    /* near-white */
--text-muted:    oklch(0.65 0.01 260)     /* secondary text */
```

### Color Palette (Light Mode)
```
--background:    oklch(0.98 0.003 260)    /* warm off-white */
--surface:       oklch(1.0 0 0)           /* pure white */
--surface-2:     oklch(0.96 0.004 260)
--border:        oklch(0.90 0.006 260)
--text:          oklch(0.15 0.01 260)
--text-muted:    oklch(0.50 0.01 260)
```

### Typography
- **Display/Headings:** Space Grotesk — geometric, modern, distinctive
- **Body/UI:** Inter — optimal readability
- **Mono/Code:** JetBrains Mono — stack traces, file paths, terminal output

### Animations & Micro-interactions
- Page transitions via Motion (fade + slide)
- Stagger animations for list items (runs, tests)
- Spring-based card hover (subtle lift + glow)
- Animated counters for statistics
- Skeleton loaders with shimmer
- Progress bars with animated fills
- Status badge transitions
- Toast notifications with spring slide-in
- Run timeline visualization
- Command palette (Cmd+K) with keyboard navigation
- Sidebar collapse with smooth width animation

---

## Architecture

### Monorepo Structure
```
trace8/
├── apps/
│   └── web/                         # Next.js 16 App Router
│       ├── src/
│       │   ├── app/                 # Pages & API routes
│       │   │   ├── (auth)/          # Sign in, sign up
│       │   │   ├── (dashboard)/     # Authenticated app
│       │   │   ├── api/             # API routes
│       │   │   │   ├── projects/    # Project CRUD
│       │   │   │   ├── runs/        # Run queries
│       │   │   │   ├── artifacts/   # Signed URLs
│       │   │   │   └── ingest/      # CLI ingestion endpoints
│       │   │   └── install.sh       # CLI install script route
│       │   ├── components/          # React components
│       │   │   ├── ui/              # shadcn primitives
│       │   │   ├── layout/          # App shell, sidebar
│       │   │   ├── runs/            # Run-specific components
│       │   │   └── shared/          # Shared components
│       │   ├── lib/                 # Utilities
│       │   │   ├── auth.ts          # Auth.js config
│       │   │   ├── db.ts            # Prisma client
│       │   │   ├── storage.ts       # Storage adapter
│       │   │   └── utils.ts         # Helpers
│       │   ├── server/              # Server actions & services
│       │   │   ├── projects.ts
│       │   │   ├── runs.ts
│       │   │   ├── tokens.ts
│       │   │   ├── flakiness.ts
│       │   │   ├── alerts.ts
│       │   │   └── usage.ts
│       │   ├── hooks/               # React hooks
│       │   ├── styles/              # Global CSS
│       │   └── generated/           # Prisma generated client
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── seed.ts
│       │   └── migrations/
│       ├── public/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── cli/                         # playwright-studio CLI
│   │   ├── src/
│   │   │   ├── commands/            # init, test, upload, doctor, unlink
│   │   │   ├── lib/                 # config, upload, runner, masking
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                      # Shared types & schemas
│       ├── src/
│       │   ├── schemas/             # Zod schemas for ingestion
│       │   ├── types/               # TypeScript types
│       │   ├── enums/               # Status, artifact types
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── package.json                     # Root workspace
├── bunfig.toml
├── turbo.json
├── .gitignore
├── LICENSE
├── README.md
├── SECURITY.md
├── SPEC.md
└── PLAN.md
```

### Data Flow
```
Developer Machine / CI
        │
        ▼
   ┌─────────┐     runs Playwright     ┌──────────────┐
   │  CLI    │ ──────────────────────► │  Playwright  │
   │ (Bun)   │     collects JSON       │  (Node)      │
   │         │ ◄────────────────────── │              │
   │         │     results + artifacts  └──────────────┘
   │         │
   │         │  1. POST /ingest/validate-token
   │         │  2. POST /ingest/runs  (creates run, gets signed URLs)
   │         │  3. PUT to R2/S3       (direct upload of artifacts)
   │         │  4. POST /ingest/runs/{id}/finalise
   │         ▼
   ┌──────────────────┐
   │   Web App (API)  │
   │   - Ingestion    │
   │   - Flakiness    │
   │   - Alerts       │
   │   - Usage        │
   └────────┬─────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
 ┌────────┐  ┌──────────┐
 │Postgres│  │R2/S3     │
 │(Neon)  │  │(Artifacts)│
 └────────┘  └──────────┘
```

---

## Database Schema (Prisma)

### Tables
- **User** — email, name, passwordHash, role (USER/ADMIN), image
- **Account** / **Session** / **VerificationToken** — Auth.js tables
- **Org** — id, name, slug
- **OrgMember** — org, user, role (OWNER/VIEWER)
- **Project** — org, name, slug, archivedAt
- **ProjectToken** — project, name, tokenHash, lastUsedAt, revokedAt
- **Environment** — project, name, slug (local/staging/production)
- **Run** — project, environment, status, sourceType, cliVersion, branch, commitSha, commitMessage, remoteUrlHash, startedAt, finishedAt, durationMs, total/passed/failed/skipped/timedOut/retry counts
- **Test** — project, filePath, titlePath, browserProjectName, stableKey
- **TestResult** — run, test, status, durationMs, retryCount, errorMessage, errorStack, stdout, stderr
- **Artifact** — run, testResult, artifactKey, type, storageKey, fileName, mimeType, sizeBytes, uploaded, expiresAt
- **FlakyTestStat** — project, test, windowSize, passCount, failCount, retryPassCount, flakeScore, classification
- **Alert** — project, provider, enabled, encryptedWebhookUrl, rules
- **AlertEvent** — project, run, alert, dedupeKey, status, sentAt, error
- **UsageCounter** — org, project, month, runsCount, artifactBytes
- **AppSetting** — key, value (JSON) — for admin OpenAI API config etc.

### Indexes (per SPEC section 7.2)
```sql
runs(project_id, started_at desc)
runs(project_id, environment_id, started_at desc)
runs(project_id, status, started_at desc)
tests(project_id, stable_key)
test_results(run_id, status)
test_results(test_id, created_at)
artifacts(run_id)
artifacts(test_result_id)
flaky_test_stats(project_id, flake_score desc)
usage_counters(org_id, month)
```

---

## API Surface

### Web App API (User-Authenticated)
- `POST /api/projects` — Create project
- `GET /api/projects` — List projects
- `GET /api/projects/{id}` — Get project
- `POST /api/projects/{id}/tokens` — Create token
- `POST /api/projects/{id}/tokens/{tokenId}/rotate` — Rotate token
- `DELETE /api/projects/{id}/tokens/{tokenId}` — Revoke token
- `GET /api/projects/{id}/runs` — List runs (paginated, filterable)
- `GET /api/runs/{id}` — Get run
- `GET /api/runs/{id}/tests` — Get run tests
- `GET /api/tests/{id}/history` — Get test history
- `POST /api/artifacts/{id}/signed-url` — Get signed read URL

### Ingestion API (Token-Authenticated)
- `POST /ingest/validate-token` — Validate project token
- `POST /ingest/runs` — Create run + get signed upload URLs
- `POST /ingest/runs/{id}/finalise` — Finalise run after uploads
- `POST /ingest/runs/{id}/upload-failed` — Mark upload failure

### Admin API
- `GET/PUT /api/admin/settings` — App settings (OpenAI API key, etc.)
- `POST /api/admin/settings/test-connection` — Test AI connection

---

## CLI Specification

### Commands
1. **`playwright-studio init`** — Link repo to project, validate token, save config
2. **`playwright-studio test`** — Run Playwright, collect results, upload, print URL
3. **`playwright-studio upload <file>`** — Upload existing Playwright JSON report
4. **`playwright-studio doctor`** — Validate config, token, Playwright, connectivity
5. **`playwright-studio unlink`** — Remove local connection

### Config File
```json
// .playwright-studio/config.json (gitignored)
{
  "apiUrl": "http://localhost:3000",
  "projectToken": "pst_xxxxxxxxx",
  "defaultEnvironment": "local",
  "capture": {
    "screenshots": "failure-only",
    "traces": "failure-only",
    "videos": "off"
  }
}
```

### Environment Variables (CI-safe)
```bash
PLAYWRIGHT_STUDIO_TOKEN=pst_xxx
PLAYWRIGHT_STUDIO_ENV=ci
PLAYWRIGHT_STUDIO_API_URL=https://app.trace8.dev
```

---

## Build Phases

### Phase 0 — Foundation
Monorepo setup, shared package, database schema, theme system, auth config.

### Phase 1 — Core SaaS
Auth pages, org model, project CRUD, token management, dashboard shell.

### Phase 2 — CLI + Ingestion
Bun CLI package, ingestion API, storage adapters, run creation flow.

### Phase 3 — Results Dashboard
Dashboard overview, projects pages, runs list, run detail, test detail.

### Phase 4 — Artefacts
Screenshot viewer, trace download, signed URLs, lazy loading.

### Phase 5 — Intelligence
Flakiness detection, regression labels, flaky tests page, charts, test history.

### Phase 6 — Alerts + Usage + Admin
Slack integration, alert rules, deduplication, usage counters, admin area.

### Phase 7 — Polish + Launch
E2E tests, performance optimization, production hardening, documentation, launch ready.
