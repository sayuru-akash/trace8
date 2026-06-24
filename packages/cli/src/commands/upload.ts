import { Command } from "commander";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { loadConfig } from "../lib/config";
import { createRun, finaliseRun, markUploadFailed } from "../lib/api";
import { buildPayload } from "../lib/payload-builder";
import { uploadArtifact } from "../lib/upload";

export function registerUploadCommand(program: Command) {
  program
    .command("upload")
    .description("Upload a Playwright JSON report to Trace8")
    .argument("<file>", "Path to Playwright JSON report file")
    .action(async (file: string) => {
      let config;
      try {
        config = await loadConfig();
      } catch (error) {
        console.error(
          "Error:",
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }

      if (!existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        process.exit(1);
      }

      console.log(`Reading report from ${file}...`);

      const reportJson = await readFile(file, "utf-8");

      console.log("Building payload...");

      let runResult;
      try {
        const payload = await buildPayload(
          reportJson,
          config.defaultEnvironment
        );
        runResult = await createRun(
          config.apiUrl,
          config.projectToken,
          payload
        );
      } catch (error) {
        console.error(
          "Error creating run:",
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }

      const { runId, runUrl, artifactUploads } = runResult;

      // Map from artifactKey → upload success
      const uploadResults = new Map<string, boolean>();

      if (artifactUploads.length > 0) {
        console.log(`Uploading ${artifactUploads.length} artifact(s)...`);

        const report = JSON.parse(reportJson);
        const allAttachments: { key: string; path: string; mimeType: string }[] =
          [];

        function collectAttachments(suite: Record<string, unknown>) {
          for (const spec of (suite.specifications as Record<string, unknown>[]) || []) {
            for (const test of (spec.tests as Record<string, unknown>[]) || []) {
              for (const result of (test.results as Record<string, unknown>[]) || []) {
                for (const att of (result.attachments as Record<string, unknown>[]) || []) {
                  if (att.path) {
                    allAttachments.push({
                      key: String(att.name),
                      path: String(att.path),
                      mimeType: String(att.contentType || "application/octet-stream"),
                    });
                  }
                }
              }
            }
          }
          for (const child of (suite.suites as Record<string, unknown>[]) || []) {
            collectAttachments(child);
          }
        }

        for (const suite of report.suites || []) {
          collectAttachments(suite);
        }

        for (const upload of artifactUploads) {
          const attachment = allAttachments.find(
            (a) => a.key === upload.artifactKey
          );
          if (attachment) {
            try {
              await uploadArtifact(
                upload.uploadUrl,
                attachment.path,
                attachment.mimeType,
                config.apiUrl
              );
              uploadResults.set(upload.artifactKey, true);
            } catch (error) {
              uploadResults.set(upload.artifactKey, false);
              console.error(
                `  Failed to upload ${upload.artifactKey}:`,
                error instanceof Error ? error.message : String(error)
              );
            }
          } else {
            uploadResults.set(upload.artifactKey, false);
          }
        }
      }

      try {
        await finaliseRun(config.apiUrl, config.projectToken, runId, {
          uploadedArtifacts: artifactUploads.map((a) => ({
            artifactKey: a.artifactKey,
            storageKey: a.storageKey,
            uploaded: uploadResults.get(a.artifactKey) ?? false,
          })),
        });
        console.log(`\n✓ Results synced: ${runUrl}`);
      } catch (error) {
        try {
          await markUploadFailed(config.apiUrl, config.projectToken, runId);
        } catch {
          // Ignore
        }
        console.error(
          "\nError finalising run:",
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    });
}
