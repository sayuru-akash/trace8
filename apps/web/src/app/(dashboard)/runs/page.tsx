import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { formatDuration, timeAgo } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { StatusBadge } from "@/components/runs/status-badge";
import { RunsFilters } from "@/components/runs/runs-filters";
import { ClickableRow } from "@/components/runs/clickable-row";
import {
  PlayCircle,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });

  if (!orgMember) {
    return (
      <PageTransition>
        <EmptyState
          title="No organization"
          description="You don't belong to an organization yet."
        />
      </PageTransition>
    );
  }

  const page = Math.max(1, Number(params.page) || 1);
  const status = typeof params.status === "string" ? params.status : "";
  const env = typeof params.env === "string" ? params.env : "";
  const branch = typeof params.branch === "string" ? params.branch : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";

  const projectIds = (
    await db.project.findMany({
      where: { orgId: orgMember.orgId, archivedAt: null },
      select: { id: true },
    })
  ).map((p) => p.id);

  if (projectIds.length === 0) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Runs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View all test runs across your projects.
            </p>
          </div>
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<PlayCircle className="h-12 w-12" />}
                title="No runs yet"
                description="Test runs will appear here once you start using the CLI."
              />
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const where: Prisma.RunWhereInput = {
    projectId: { in: projectIds },
  };

  if (
    status &&
    ["passed", "failed", "timed_out", "cancelled"].includes(status)
  ) {
    where.status = status as Prisma.RunWhereInput["status"];
  }

  if (env) {
    where.environment = { slug: env };
  }

  if (branch) {
    where.branch = { contains: branch, mode: "insensitive" };
  }

  if (from || to) {
    const startedAt: Record<string, Date> = {};
    if (from) startedAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      startedAt.lte = toDate;
    }
    where.startedAt = startedAt;
  }

  const [runs, total] = await Promise.all([
    db.run.findMany({
      where,
      include: {
        project: { select: { name: true, slug: true } },
        environment: { select: { name: true, slug: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.run.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Runs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View all test runs across your projects.
          </p>
        </div>

        <Suspense>
          <RunsFilters />
        </Suspense>

        {runs.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<PlayCircle className="h-12 w-12" />}
                title="No runs found"
                description={
                  status || env || branch || from || to
                    ? "Try adjusting your filters."
                    : "Test runs will appear here once you start using the CLI."
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Commit</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <ClickableRow key={run.id} href={`/runs/${run.id}`}>
                      <TableCell>
                        <StatusBadge status={run.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {run.project.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {run.branch ? (
                          <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                            <GitBranch className="h-3.5 w-3.5" />
                            {run.branch}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {run.commitSha ? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {run.commitSha.slice(0, 7)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {run.startedAt ? timeAgo(run.startedAt) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {formatDuration(run.durationMs)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          <span
                            className={
                              run.failed > 0
                                ? "text-danger font-medium"
                                : "text-foreground"
                            }
                          >
                            {run.passed}
                          </span>
                          <span className="text-muted-foreground">/{run.total}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            run.sourceType === "ci" ? "info" : "outline"
                          }
                          className="text-xs"
                        >
                          {run.sourceType === "ci" ? "CI" : "Local"}
                        </Badge>
                      </TableCell>
                    </ClickableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total} runs
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={
                    page > 1
                      ? `/runs?page=${page - 1}${status ? `&status=${status}` : ""}${env ? `&env=${env}` : ""}${branch ? `&branch=${branch}` : ""}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`
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
                      ? `/runs?page=${page + 1}${status ? `&status=${status}` : ""}${env ? `&env=${env}` : ""}${branch ? `&branch=${branch}` : ""}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`
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
          </>
        )}
      </div>
    </PageTransition>
  );
}
