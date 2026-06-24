# Trace8 CLI — playwright-studio

CLI tool for integrating Playwright test suites with the Trace8 dashboard.

## Install

```bash
npm install -g playwright-studio
```

Or use directly with npx:

```bash
npx playwright-studio init
```

## Quick Start

```bash
# Initialize Trace8 in your project
npx playwright-studio init

# Run tests and upload results
npx playwright-studio test

# Upload an existing JSON report
npx playwright-studio upload test-results/report.json
```

## Commands

### `playwright-studio init`

Initialize Trace8 configuration in your project.

- Prompts for project token
- Creates `.playwright-studio/config.json` config file

### `playwright-studio test`

Run Playwright tests and automatically capture results.

- Executes `npx playwright test`
- Collects results and uploads to Trace8
- Returns exit code from Playwright
- `--env <environment>` — Set environment (local, staging, production)
- `--require-upload` — Exit non-zero if artifact upload fails (CI mode)

### `playwright-studio upload <file>`

Upload a Playwright JSON report file to Trace8.

- `<file>` — Path to Playwright JSON report file (e.g., `test-results/report.json`)
- Reads `.playwright-studio/config.json` for project token

### `playwright-studio doctor`

Diagnose connection and configuration issues.

- Checks `.playwright-studio/config.json` exists and is valid
- Tests API connectivity
- Verifies Playwright is installed
- Checks artifact paths are writable
- Reports environment info

### `playwright-studio unlink`

Remove Trace8 configuration from your project.

- Deletes `.playwright-studio/config.json`

## Config File

`playwright-studio` uses `.playwright-studio/config.json` in your project root:

```json
{
  "apiUrl": "https://trace8.app/api",
  "projectToken": "your-project-token",
  "defaultEnvironment": "local",
  "capture": {
    "screenshots": "failure-only",
    "traces": "failure-only",
    "videos": "off"
  }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PLAYWRIGHT_STUDIO_TOKEN` | Project token (overrides config file) |
| `PLAYWRIGHT_STUDIO_API_URL` | API base URL (overrides config file) |
| `PLAYWRIGHT_STUDIO_ENV` | Default environment (overrides config file) |

## CI/CD Examples

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run tests and sync to Trace8
        run: npx playwright-studio test --env=ci --require-upload
        env:
          PLAYWRIGHT_STUDIO_TOKEN: ${{ secrets.PLAYWRIGHT_STUDIO_TOKEN }}
```

### GitLab CI

```yaml
e2e:
  image: mcr.microsoft.com/playwright:v1.50.0-noble
  script:
    - npm ci
    - npx playwright-studio test --env=ci --require-upload
  variables:
    PLAYWRIGHT_STUDIO_TOKEN: $PLAYWRIGHT_STUDIO_TOKEN
```

## License

Proprietary — Codezela Technologies
