import { z } from "zod";
import { cliConfigSchema } from "@trace8/shared";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const CONFIG_DIR = ".playwright-studio";
const CONFIG_FILE = "config.json";

export type Config = z.infer<typeof cliConfigSchema>;

export async function loadConfig(): Promise<Config> {
  const envConfig = loadFromEnv();
  if (envConfig) return envConfig;

  const configPath = path.join(process.cwd(), CONFIG_DIR, CONFIG_FILE);
  if (!existsSync(configPath)) {
    throw new Error(
      "No config found. Run `playwright-studio init` first, or set PLAYWRIGHT_STUDIO_TOKEN env var."
    );
  }

  const raw = await readFile(configPath, "utf-8");
  const data = JSON.parse(raw);
  return validateConfig(data);
}

export async function saveConfig(config: Config): Promise<void> {
  const dir = path.join(process.cwd(), CONFIG_DIR);
  await mkdir(dir, { recursive: true });
  const configPath = path.join(dir, CONFIG_FILE);
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");

  const gitignorePath = path.join(process.cwd(), ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = await readFile(gitignorePath, "utf-8");
    if (!content.includes(CONFIG_DIR)) {
      await writeFile(
        gitignorePath,
        content.trimEnd() + "\n" + CONFIG_DIR + "/\n",
        "utf-8"
      );
    }
  }
}

export function validateConfig(data: unknown): Config {
  return cliConfigSchema.parse(data);
}

function loadFromEnv(): Config | null {
  const token = process.env.PLAYWRIGHT_STUDIO_TOKEN;
  if (!token) return null;

  return {
    apiUrl: process.env.PLAYWRIGHT_STUDIO_API_URL || "http://localhost:3000",
    projectToken: token,
    defaultEnvironment: (process.env.PLAYWRIGHT_STUDIO_ENV as Config["defaultEnvironment"]) || "local",
    capture: {
      screenshots: "failure-only",
      traces: "failure-only",
      videos: "off",
    },
  };
}
