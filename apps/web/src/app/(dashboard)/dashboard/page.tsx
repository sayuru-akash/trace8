import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo, formatDuration } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/runs/status-badge";
import {
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GitBranch,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
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

  const projects = await db.project.findMany({
    where: { orgId: orgMember.orgId, archivedAt: null },
    include: {
      runs: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { runs: true } },
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalRunsThisMonth = await db.run.count({
    where: {
      project: { orgId: orgMember.orgId },
      createdAt: { gte: monthStart },
    },
  });

  const passedRuns = await db.run.count({
    where: {
      project: { orgId: orgMember.orgId },
      status: "passed",
      createdAt: { gte: monthStart },
    },
  });

  const passRate =
    totalRunsThisMonth > 0
      ? Math.round((passedRuns / totalRunsThisMonth) * 100)
      : 0;

  const flakyTests = await db.flakyTestStat.count({
    where: {
      project: { orgId: orgMember.orgId },
      classification: { in: ["flaky", "regression"] },
    },
  });

  const projectIds = projects.map((p) => p.id);

  const recentFailedRuns = projectIds.length > 0
    ? await db.run.findMany({
        where: {
          projectId: { in: projectIds },
          status: "failed",
        },
        include: {
          project: { select: { name: true, slug: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      })
    : [];

  const recentActivity = projectIds.length > 0
    ? await db.run.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          project: { select: { name: true, slug: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 10,
      })
    : [];

  const userName = session!.user!.name?.split(" ")[0] ?? "there";

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your test suite.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Projects"
            value={projects.length}
            icon={<FolderKanban className="h-5 w-5" />}
          />
          <StatCard
            label="Runs This Month"
            value={totalRunsThisMonth}
            icon={<PlayCircle className="h-5 w-5" />}
          />
          <StatCard
            label="Pass Rate"
            value={passRate}
            suffix="%"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            label="Flaky Tests"
            value={flakyTests}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>

        {/* Projects or Empty State */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FolderKanban className="h-12 w-12" />}
                title="Create your first project"
                description="Projects organize your test runs, environments, and tokens."
                action={{
                  label: "Create Project",
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Projects</CardTitle>
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => {
                  const lastRun = project.runs[0];
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-surface-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FolderKanban className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project._count.runs} runs
                          </p>
                        </div>
                      </div>
                      {lastRun ? (
                        <Badge
                          variant={
                            lastRun.status === "passed"
                              ? "success"
                              : lastRun.status === "failed"
                                ? "danger"
                                : "outline"
                          }
                        >
                          {lastRun.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No runs</Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Failed Runs & Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Failed Runs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-danger" />
                  Recent Failed Runs
                </CardTitle>
                <Link href="/runs?status=failed">
                  <Button variant="outline" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentFailedRuns.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No failed runs recently
                </p>
              ) : (
                <div className="space-y-2">
                  {recentFailedRuns.map((run) => (
                    <Link
                      key={run.id}
                      href={`/runs/${run.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-surface-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">
                            {run.project.name}
                          </span>
                          {run.branch && (
                            <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                              <GitBranch className="h-3 w-3" />
                              {run.branch}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {run.failed} failed / {run.total} total
                          </span>
                          <span>{formatDuration(run.durationMs)}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {run.startedAt ? timeAgo(run.startedAt) : "—"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((run) => (
                    <Link
                      key={run.id}
                      href={`/runs/${run.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-2/50 transition-colors"
                    >
                      <StatusBadge
                        status={run.status}
                        size="sm"
                        showIcon={false}
                      />
                      <span className="flex-1 text-sm text-foreground truncate">
                        {run.project.name}
                      </span>
                      {run.branch && (
                        <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                          {run.branch}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground shrink-0">
                        {run.startedAt ? timeAgo(run.startedAt) : "—"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
