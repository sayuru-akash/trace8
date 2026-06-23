import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDuration, timeAgo, formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { StatusBadge } from "@/components/runs/status-badge";
import { SummaryBar } from "@/components/runs/summary-bar";
import { CopyUrlButton } from "@/components/runs/copy-url-button";
import {
  ArrowLeft,
  GitBranch,
  GitCommit,
  Calendar,
  Clock,
  FileText,
  Camera,
  FileSearch,
  Repeat,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { runId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const session = await auth();
  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });

  if (!orgMember) notFound();

  const run = await db.run.findUnique({
    where: { id: runId },
    include: {
      project: true,
      environment: true,
      testResults: {
        include: { test: true, artifacts: true },
        orderBy: [{ status: "asc" }, { durationMs: "desc" }],
      },
      artifacts: true,
    },
  });

  if (!run || run.project.orgId !== orgMember.orgId) notFound();

  const failedFirst = [...run.testResults].sort((a, b) => {
    const aFailed = a.status === "failed" ? 0 : 1;
    const bFailed = b.status === "failed" ? 0 : 1;
    if (aFailed !== bFailed) return aFailed - bFailed;
    return (b.durationMs ?? 0) - (a.durationMs ?? 0);
  });

  const paginatedResults = failedFirst.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  const totalResults = failedFirst.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  const baseQuery = `page=`;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back button */}
        <Link href="/runs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Runs
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={run.status} size="lg" />
              <Link
                href={`/projects/${run.project.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {run.project.name}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {run.branch && (
                <span className="flex items-center gap-1.5 font-mono">
                  <GitBranch className="h-4 w-4" />
                  {run.branch}
                </span>
              )}
              {run.commitSha && (
                <span className="flex items-center gap-1.5 font-mono">
                  <GitCommit className="h-4 w-4" />
                  {run.commitSha.slice(0, 7)}
                </span>
              )}
              {run.environment && (
                <Badge variant="outline">{run.environment.name}</Badge>
              )}
              {run.startedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {run.startedAt.toLocaleString()}
                </span>
              )}
              {run.durationMs != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDuration(run.durationMs)}
                </span>
              )}
            </div>
            {run.commitMessage && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {run.commitMessage}
              </p>
            )}
          </div>
          <CopyUrlButton path={`/runs/${run.id}`} />
        </div>

        {/* Summary Bar */}
        <Card>
          <CardContent className="p-6">
            <SummaryBar
              passed={run.passed}
              failed={run.failed}
              skipped={run.skipped}
              timedOut={run.timedOut}
              total={run.total}
            />
          </CardContent>
        </Card>

        {/* Test Results */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4">
            Test Results ({totalResults})
          </h2>

          {totalResults === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<FileText className="h-12 w-12" />}
                  title="No test results"
                  description="This run has no test results."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedResults.map((result) => {
                  const testTitle = result.test.titlePath.join(" › ");
                  const hasScreenshot = result.artifacts.some(
                    (a) => a.type === "screenshot"
                  );
                  const hasTrace = result.artifacts.some(
                    (a) => a.type === "trace"
                  );

                  return (
                    <Link
                      key={result.id}
                      href={`/tests/${result.testId}?runId=${run.id}`}
                      className="block"
                    >
                      <Card className="hover:bg-surface-2/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <StatusBadge
                                  status={result.status}
                                  size="sm"
                                />
                                {result.test.browserProjectName && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.test.browserProjectName}
                                  </Badge>
                                )}
                                {result.retryCount > 0 && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Repeat className="h-3 w-3" />
                                    {result.retryCount} retries
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground truncate">
                                {testTitle}
                              </p>
                              <p className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground truncate">
                                <FileText className="h-3 w-3 shrink-0" />
                                {result.test.filePath}
                              </p>
                              {result.errorMessage && (
                                <p className="flex items-start gap-1.5 text-xs text-danger/80 line-clamp-1">
                                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  {result.errorMessage.split("\n")[0]}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="text-sm font-mono text-muted-foreground">
                                {formatDuration(result.durationMs)}
                              </span>
                              <div className="flex items-center gap-1">
                                {hasScreenshot && (
                                  <span className="text-muted-foreground">
                                    <Camera className="h-4 w-4" />
                                  </span>
                                )}
                                {hasTrace && (
                                  <span className="text-muted-foreground">
                                    <FileSearch className="h-4 w-4" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, totalResults)} of{" "}
                    {totalResults} results
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={
                        page > 1
                          ? `/runs/${run.id}?page=${page - 1}`
                          : "#"
                      }
                      aria-disabled={page <= 1}
                      tabIndex={page <= 1 ? -1 : 0}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Link
                      href={
                        page < totalPages
                          ? `/runs/${run.id}?page=${page + 1}`
                          : "#"
                      }
                      aria-disabled={page >= totalPages}
                      tabIndex={page >= totalPages ? -1 : 0}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
