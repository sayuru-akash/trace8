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

# Upload an existing JUnit XML file
npx playwright-studio upload results.xml
```

## Commands

### `playwright-studio init`

Initialize Trace8 configuration in your project.

- Prompts for project ID and API key
- Creates `.trace8.json` config file
- Optionally patches `playwright.config.ts` with reporter

### `playwright-studio test`

Run Playwright tests and automatically capture results.

- Executes `npx playwright test`
- Collects results and uploads to Trace8
- Returns exit code from Playwright

### `playwright-studio upload <file>`

Upload a JUnit XML results file to Trace8.

- `<file>` — Path to JUnit XML file (e.g., `test-results/results.xml`)
- Reads `.trace8.json` for project ID and API key

### `playwright-studio doctor`

Diagnose connection and configuration issues.

- Checks `.trace8.json` exists and is valid
- Tests API connectivity
- Verifies Playwright is installed
- Reports environment info

### `playwright-studio unlink`

Remove Trace8 configuration from your project.

- Deletes `.trace8.json`
- Reverts `playwright.config.ts` changes (if any)

## Config File

`playwright-studio` uses a `.trace8.json` in your project root:

```json
{
  "projectId": "your-project-id",
  "apiKey": "your-api-key",
  "apiUrl": "https://trace8.app/api"
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TRACE8_API_KEY` | API key (overrides config file) |
| `TRACE8_API_URL` | API base URL (overrides config file) |
| `TRACE8_PROJECT_ID` | Project ID (overrides config file) |

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

      - name: Run tests
        run: npx playwright test

      - name: Upload results to Trace8
        if: always()
        run: npx playwright-studio upload test-results/results.xml
        env:
          TRACE8_API_KEY: ${{ secrets.TRACE8_API_KEY }}
```

### GitLab CI

```yaml
e2e:
  image: mcr.microsoft.com/playwright:v1.50.0-noble
  script:
    - npm ci
    - npx playwright test
    - npx playwright-studio upload test-results/results.xml
  variables:
    TRACE8_API_KEY: $TRACE8_API_KEY
```

## License

Proprietary — Codezela Technologies
