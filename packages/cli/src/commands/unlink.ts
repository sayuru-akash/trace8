import { Command } from "commander";
import { rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export function registerUnlinkCommand(program: Command) {
  program
    .command("unlink")
    .description("Remove local Playwright Studio configuration")
    .action(async () => {
      const configDir = path.join(process.cwd(), ".playwright-studio");

      if (!existsSync(configDir)) {
        console.log("No .playwright-studio directory found.");
        return;
      }

      await rm(configDir, { recursive: true, force: true });
      console.log("✓ Removed .playwright-studio/ directory.");
    });
}
