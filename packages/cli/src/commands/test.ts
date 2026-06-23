import { Command } from "commander";
import { loadConfig } from "../lib/config";
import { createRun, finaliseRun, markUploadFailed } from "../lib/api";
import { runPlaywright } from "../lib/runner";
import { buildPayload } from "../lib/payload-builder";
import { uploadArtifact } from "../lib/upload";

export function registerTestCommand(program: Command) {
  program
    .command("test")
    .description("Run Playwright tests and sync results to Trace8")
    .allowUnknownOption()
    .argument("[args...]", "Arguments passed to Playwright")
    .action(async (args: string[]) => {
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

      console.log("Running Playwright tests...\n");

      const { exitCode, resultsJson } = await runPlaywright(args);

      if (!resultsJson) {
        console.error("\nError: No test results generated.");
        process.exit(exitCode);
      }

      console.log("\nSyncing results to Trace8...");

      let runResult;
      try {
        const payload = await buildPayload(
          resultsJson,
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
        process.exit(exitCode);
      }

      const { runId, runUrl, artifactUploads } = runResult;

      if (artifactUploads.length > 0) {
        console.log(`Uploading ${artifactUploads.length} artifact(s)...`);

        const payload = JSON.parse(resultsJson);
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

        for (const suite of payload.suites || []) {
          collectAttachments(suite);
        }

        for (const upload of artifactUploads) {
          const attachment = allAttachments.find(
            (a) => a.key === upload.artifactKey.split("-").slice(-1)[0]
          );
          if (attachment) {
            try {
              await uploadArtifact(
                upload.uploadUrl,
                attachment.path,
                attachment.mimeType,
                config.apiUrl
              );
            } catch (error) {
              console.error(
                `  Failed to upload ${upload.artifactKey}:`,
                error instanceof Error ? error.message : String(error)
              );
            }
          }
        }
      }

      try {
        await finaliseRun(config.apiUrl, config.projectToken, runId, {
          uploadedArtifacts: artifactUploads.map((a) => ({
            artifactKey: a.artifactKey,
            storageKey: a.storageKey,
            uploaded: true,
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
      }

      process.exit(exitCode);
    });
}
