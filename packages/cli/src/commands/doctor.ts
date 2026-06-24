import { Command } from "commander";
import { existsSync } from "fs";
import { access } from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { loadConfig } from "../lib/config";
import { validateToken } from "../lib/api";

export function registerDoctorCommand(program: Command) {
  program
    .command("doctor")
    .description("Check CLI configuration and connectivity")
    .action(async () => {
      console.log("Playwright Studio — Health Check\n");

      let hasFailures = false;

      // 1. Config file
      const configPath = path.join(
        process.cwd(),
        ".playwright-studio",
        "config.json"
      );
      const hasConfig = existsSync(configPath);
      const hasEnvToken = !!process.env.PLAYWRIGHT_STUDIO_TOKEN;

      console.log(
        `1. Config file: ${hasConfig ? "✓ Found" : hasEnvToken ? "✓ Using env vars" : "✗ Not found"}`
      );

      if (!hasConfig && !hasEnvToken) {
        console.log("   Run `playwright-studio init` to set up.\n");
        console.log("Checks failed.");
        process.exit(1);
      }

      // 2. Token validation
      let config;
      try {
        config = await loadConfig();
        console.log(`2. Token: Loaded from ${hasConfig ? "config file" : "env vars"}`);
      } catch (error) {
        console.log(
          `2. Token: ✗ Failed to load — ${error instanceof Error ? error.message : String(error)}`
        );
        hasFailures = true;
      }

      // 3. API connectivity + token validity
      if (config) {
        try {
          const result = await validateToken(config.apiUrl, config.projectToken);
          if (result.valid) {
            console.log(`3. API: ✓ Connected to ${config.apiUrl}`);
            console.log(`   Project: ${result.projectName} (${result.orgSlug})`);
          } else {
            console.log(`3. API: ✗ Token is invalid`);
            hasFailures = true;
          }
        } catch (error) {
          console.log(
            `3. API: ✗ Cannot reach ${config.apiUrl} — ${error instanceof Error ? error.message : String(error)}`
          );
          hasFailures = true;
        }
      } else {
        console.log("3. API: ✗ Skipped (no config)");
        hasFailures = true;
      }

      // 4. Playwright installation
      try {
        const version = execSync("npx playwright --version", {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        console.log(`4. Playwright: ✓ ${version}`);
      } catch {
        console.log(
          "4. Playwright: ✗ Not installed (run `npx playwright install`)"
        );
        hasFailures = true;
      }

      // 5. Artifact paths
      const testResultsDir = path.join(process.cwd(), "test-results");
      try {
        await access(testResultsDir, 0o2); // W_OK
        console.log(`5. Artifact paths: ✓ ${testResultsDir} is writable`);
      } catch {
        if (existsSync(testResultsDir)) {
          console.log(`5. Artifact paths: ✗ ${testResultsDir} exists but is not writable`);
        } else {
          console.log(`5. Artifact paths: ✗ ${testResultsDir} does not exist`);
        }
        hasFailures = true;
      }

      if (hasFailures) {
        console.log("\n✗ Some checks failed.");
        process.exit(1);
      }

      console.log("\n✓ All checks passed.");
    });
}
