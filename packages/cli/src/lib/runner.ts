import { spawn } from "child_process";
import path from "path";
import { existsSync } from "fs";

export interface PlaywrightResult {
  exitCode: number;
  resultsJson: string | null;
  outputPath: string;
}

export async function runPlaywright(args: string[]): Promise<PlaywrightResult> {
  const outputPath = path.join(
    process.cwd(),
    "test-results",
    `.playwright-studio-report-${Date.now()}.json`
  );

  const pwArgs = [
    "playwright",
    "test",
    "--reporter=json",
    `--output=${path.join(process.cwd(), "test-results")}`,
    ...args,
  ];

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn("npx", pwArgs, {
      stdio: ["inherit", "pipe", "pipe"],
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: outputPath,
      },
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data: Buffer) => {
      process.stdout.write(data);
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(data);
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });

  let resultsJson: string | null = null;
  if (existsSync(outputPath)) {
    const { readFile } = await import("fs/promises");
    resultsJson = await readFile(outputPath, "utf-8");
  }

  return { exitCode, resultsJson, outputPath };
}
