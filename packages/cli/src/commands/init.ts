import { Command } from "commander";
import { loadConfig, saveConfig } from "../lib/config";
import { validateToken } from "../lib/api";
import { createInterface } from "readline";

async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function registerInitCommand(program: Command) {
  program
    .command("init")
    .description("Configure project token and environment")
    .action(async () => {
      try {
        let apiUrl =
          process.env.PLAYWRIGHT_STUDIO_API_URL ||
          "http://localhost:3000";
        let token = process.env.PLAYWRIGHT_STUDIO_TOKEN || "";
        let environment =
          process.env.PLAYWRIGHT_STUDIO_ENV || "local";

        if (!token) {
          token = await prompt("Enter your project token: ");
          if (!token) {
            console.error("Error: Token is required.");
            process.exit(1);
          }
        }

        const envInput = await prompt(
          `Default environment (local/staging/production) [${environment}]: `
        );
        if (envInput) {
          environment = envInput;
        }

        console.log("\nValidating token...");

        const result = await validateToken(apiUrl, token);

        if (!result.valid) {
          console.error("Error: Invalid token.");
          process.exit(1);
        }

        await saveConfig({
          apiUrl,
          projectToken: token,
          defaultEnvironment: environment as "local" | "staging" | "production",
          capture: {
            screenshots: "failure-only",
            traces: "failure-only",
            videos: "off",
          },
        });

        console.log(`\n✓ Linked to project: ${result.projectName}`);
        console.log(`  Org: ${result.orgSlug}`);
        console.log(`  Environment: ${environment}`);
        console.log(`  Config saved to .playwright-studio/config.json`);
      } catch (error) {
        console.error(
          "Error:",
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
