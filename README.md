<p align="center">
  <img src="apps/web/public/trace8-logo.svg" alt="Trace8" width="120" />
</p>

<h1 align="center">Trace8</h1>
<p align="center">Playwright Testing Studio</p>

<p align="center">
  Run Playwright tests as usual. Stop digging through terminal output.<br/>
  Every run syncs into a clean dashboard where failures, traces, screenshots, and flaky tests are easy to understand.
</p>

---

## Features

- **Dashboard** — Project-level stats, pass/fail trends, and run history at a glance
- **Run Viewer** — Step-by-step breakdown of every Playwright run with traces, screenshots, and errors
- **Test Explorer** — Browse tests by file, status, or flake classification
- **Flaky Test Detection** — Automated flake scoring with classification (stable, watch, flaky, regression)
- **Alerts** — Configurable alerts for new failures, flaky spikes, and regressions
- **CLI** — `playwright-studio` CLI to init, run, upload, and diagnose test suites
- **Multi-project & Team support** — Invite teammates, manage API keys, and segment by environment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| UI Components | Radix UI, shadcn-style primitives, Recharts, Motion |
| Backend | Next.js Route Handlers, Prisma 7 |
| Database | PostgreSQL |
| Auth | NextAuth v5 (Credentials + Prisma Adapter) |
| CLI | Commander.js, published as `playwright-studio` |
| Shared | `@trace8/shared` workspace package |
| Testing | Vitest (unit), Playwright (E2E) |

## Architecture

```
trace8/
├── apps/web/          # Next.js 16 SaaS application
│   ├── src/app/       # App Router pages & API routes
│   ├── src/components/# UI components
│   ├── src/server/    # Services, DB, auth
│   ├── src/lib/       # Utilities
│   ├── e2e/           # Playwright E2E tests
│   └── prisma/        # Schema, migrations, seed
├── packages/cli/      # playwright-studio CLI
└── packages/shared/   # Shared types, constants, schemas
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Bun ≥ 1.1
- PostgreSQL 16+

### Environment Setup

```bash
cp apps/web/.env.example apps/web/.env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, APP_URL
```

### Install & Setup

```bash
bun install
bun run --filter @trace8/web db:generate
bun run --filter @trace8/web db:push
bun run --filter @trace8/web db:seed
```

### Development

```bash
bun run --filter @trace8/web dev
```

Open [http://localhost:3000](http://localhost:3000).

## CLI Usage

The `playwright-studio` CLI integrates Trace8 into your existing Playwright workflow.

### Install

```bash
npm install -g playwright-studio
# or
npx playwright-studio init
```

### Commands

| Command | Description |
|---------|-------------|
| `playwright-studio init` | Initialize Trace8 in your project (creates config, updates `playwright.config.ts`) |
| `playwright-studio test` | Run Playwright tests and capture results |
| `playwright-studio upload <file>` | Upload a JUnit XML results file |
| `playwright-studio doctor` | Diagnose connection and configuration issues |
| `playwright-studio unlink` | Remove Trace8 config from project |

### Config File

`playwright-studio` creates a `.trace8.json` in your project root:

```json
{
  "projectId": "your-project-id",
  "apiKey": "your-api-key",
  "apiUrl": "https://trace8.app/api"
}
```

### CI/CD Example

```yaml
# GitHub Actions
- name: Run tests
  run: npx playwright test

- name: Upload results
  run: npx playwright-studio upload test-results/results.xml
  env:
    TRACE8_API_KEY: ${{ secrets.TRACE8_API_KEY }}
```

## API Overview

Trace8 exposes a REST API under `/api/` for programmatic access:

| Endpoint | Description |
|----------|-------------|
| `POST /api/runs` | Submit a new test run |
| `GET /api/projects` | List projects |
| `GET /api/projects/:id/runs` | List runs for a project |
| `GET /api/projects/:id/tests` | List tests with flake stats |

Authentication via Bearer token (API key) or session cookie.

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Set environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `APP_URL`)
4. Deploy — `postinstall` handles Prisma generate

## License

Proprietary — Codezela Technologies
