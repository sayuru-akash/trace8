import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDuration, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { StatusBadge } from "@/components/runs/status-badge";
import { ArtifactDisplay } from "@/components/runs/artifact-display";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
} from "lucide-react";
import Link from "next/link";

const STATUS_DOT_COLORS: Record<string, string> = {
  passed: "bg-success",
  failed: "bg-danger",
  skipped: "bg-muted-foreground/30",
  timed_out: "bg-warning",
  interrupted: "bg-muted-foreground/30",
  flaky: "bg-warning",
  unknown: "bg-muted-foreground/30",
};

const FLAKY_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" }
> = {
  stable: { label: "Stable", variant: "success" },
  watch: { label: "Watch", variant: "info" },
  flaky: { label: "Flaky", variant: "warning" },
  regression: { label: "Regression", variant: "danger" },
};

export default async function TestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { testId } = await params;
  const sp = await searchParams;
  const runId = typeof sp.runId === "string" ? sp.runId : undefined;

  const session = await auth();
  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });

  if (!orgMember) notFound();

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      results: {
        include: { run: { include: { project: true } }, artifacts: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      flakyStats: true,
    },
  });

  if (!test || test.projectId === undefined) notFound();

  const project = await db.project.findUnique({
    where: { id: test.projectId },
  });

  if (!project || project.orgId !== orgMember.orgId) notFound();

  const currentResult = runId
    ? test.results.find((r) => r.runId === runId)
    : test.results[0];

  const flakyStat = test.flakyStats[0];
  const flakyConfig = flakyStat
    ? FLAKY_CONFIG[flakyStat.classification]
    : null;

  const testTitle = test.titlePath.join(" › ");

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back button */}
        <Link href={runId ? `/runs/${runId}` : "/runs"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {runId ? "Back to Run" : "Back to Runs"}
          </Button>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {currentResult && (
              <StatusBadge status={currentResult.status} size="lg" />
            )}
            {flakyConfig && (
              <Badge variant={flakyConfig.variant}>
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                {flakyConfig.label}
              </Badge>
            )}
            {test.browserProjectName && (
              <Badge variant="outline">{test.browserProjectName}</Badge>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {testTitle}
          </h1>
          <p className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0" />
            {test.filePath}
          </p>
        </div>

        {/* Error Section */}
        {currentResult?.errorMessage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger">
                <XCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-surface-2 p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-danger/90 whitespace-pre-wrap">
                  {currentResult.errorMessage}
                </pre>
              </div>
              {currentResult.errorStack && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Stack Trace
                  </summary>
                  <div className="mt-2 max-h-80 overflow-auto rounded-lg bg-surface-2 p-4">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {currentResult.errorStack}
                    </pre>
                  </div>
                </details>
              )}
              {currentResult.stdout && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    stdout
                  </summary>
                  <div className="mt-2 max-h-60 overflow-auto rounded-lg bg-surface-2 p-4">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {currentResult.stdout}
                    </pre>
                  </div>
                </details>
              )}
              {currentResult.stderr && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    stderr
                  </summary>
                  <div className="mt-2 max-h-60 overflow-auto rounded-lg bg-surface-2 p-4">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {currentResult.stderr}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        )}

        {/* Artifacts Section */}
        {currentResult && currentResult.artifacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentResult.artifacts.map((artifact) => (
                <ArtifactDisplay
                  key={artifact.id}
                  artifactId={artifact.id}
                  type={artifact.type}
                  fileName={artifact.fileName}
                  sizeBytes={Number(artifact.sizeBytes)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* History Section */}
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {test.results.length === 0 ? (
              <EmptyState
                title="No history"
                description="This test has no recorded results."
              />
            ) : (
              <div className="space-y-4">
                {/* Dot timeline */}
                <div className="flex gap-1.5 flex-wrap">
                  {test.results.map((result) => {
                    const isCurrent = result.runId === runId;
                    return (
                      <Link
                        key={result.id}
                        href={`/tests/${test.id}?runId=${result.runId}`}
                        className={`h-6 w-6 rounded-full ${STATUS_DOT_COLORS[result.status] ?? "bg-muted-foreground/30"} ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:opacity-80"} transition-all`}
                        title={`${result.status} · ${formatDuration(result.durationMs)} · ${timeAgo(result.createdAt)}`}
                      />
                    );
                  })}
                </div>

                {/* Results list */}
                <div className="space-y-1">
                  {test.results.map((result) => {
                    const isCurrent = result.runId === runId;
                    const StatusIcon =
                      result.status === "passed"
                        ? CheckCircle2
                        : result.status === "failed"
                          ? XCircle
                          : result.status === "timed_out"
                            ? Clock
                            : MinusCircle;
                    const iconColor =
                      result.status === "passed"
                        ? "text-success"
                        : result.status === "failed"
                          ? "text-danger"
                          : result.status === "timed_out"
                            ? "text-warning"
                            : "text-muted-foreground";

                    return (
                      <Link
                        key={result.id}
                        href={`/tests/${test.id}?runId=${result.runId}`}
                        className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                          isCurrent
                            ? "bg-surface-2 border border-border"
                            : "hover:bg-surface-2/50"
                        }`}
                      >
                        <StatusIcon
                          className={`h-4 w-4 shrink-0 ${iconColor}`}
                        />
                        <span className="flex-1 text-sm text-foreground">
                          {result.run.project.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(result.durationMs)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(result.createdAt)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
