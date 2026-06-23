import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Plus,
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
      </div>
    </PageTransition>
  );
}
