import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { StatCard } from "@/components/shared/stat-card";
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Terminal,
} from "lucide-react";
import Link from "next/link";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });
  if (!orgMember) notFound();

  const project = await db.project.findFirst({
    where: { orgId: orgMember.orgId, slug, archivedAt: null },
    include: {
      environments: true,
      tokens: {
        where: { revokedAt: null },
        select: { id: true, name: true, tokenHash: true, createdAt: true },
      },
      _count: { select: { runs: true, tests: true } },
    },
  });

  if (!project) notFound();

  const latestRun = await db.run.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, createdAt: true, passed: true, failed: true, total: true },
  });

  const hasRuns = project._count.runs > 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {project.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {project.slug}
              </span>
              <div className="flex gap-1">
                {project.environments.map((env) => (
                  <Badge key={env.slug} variant="outline" className="text-xs">
                    {env.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Link href={`/projects/${project.slug}/settings`}>
            <Button variant="outline">Settings</Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="runs">Runs</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Runs"
                value={project._count.runs}
                icon={<PlayCircle className="h-5 w-5" />}
              />
              <StatCard
                label="Tests"
                value={project._count.tests}
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <StatCard
                label="Failure Rate"
                value={
                  latestRun && latestRun.total > 0
                    ? Math.round((latestRun.failed / latestRun.total) * 100)
                    : 0
                }
                suffix="%"
              />
              <StatCard label="Flake Rate" value={0} suffix="%" />
            </div>

            {/* Empty state or latest run info */}
            {!hasRuns ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Terminal className="h-12 w-12" />}
                    title="No runs yet"
                    description="Install the Trace8 CLI and run your first test suite."
                  />
                  <div className="mx-auto mt-6 max-w-md space-y-3">
                    <div className="rounded-lg bg-surface-2 p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Install CLI
                      </p>
                      <code className="text-sm font-mono text-foreground">
                        npm install -g @trace8/cli
                      </code>
                    </div>
                    <div className="rounded-lg bg-surface-2 p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Run tests
                      </p>
                      <code className="text-sm font-mono text-foreground">
                        trace8 test --token pst_...
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Run</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          latestRun!.status === "passed"
                            ? "success"
                            : latestRun!.status === "failed"
                              ? "danger"
                              : "outline"
                        }
                      >
                        {latestRun!.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {latestRun!.passed} passed, {latestRun!.failed} failed
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {latestRun!.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Setup status */}
            <Card>
              <CardHeader>
                <CardTitle>Setup Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">Project Token</span>
                  {project.tokens.length > 0 ? (
                    <Badge variant="success">Configured</Badge>
                  ) : (
                    <Link href={`/projects/${project.slug}/settings`}>
                      <Badge variant="warning" className="cursor-pointer">
                        Create token
                      </Badge>
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">Environments</span>
                  <span className="text-sm text-muted-foreground">
                    {project.environments.length} configured
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="runs">
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<PlayCircle className="h-12 w-12" />}
                  title="No runs yet"
                  description="Test runs will appear here once you start using the CLI."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<CheckCircle2 className="h-12 w-12" />}
                  title="No tests yet"
                  description="Test results will appear here after your first run."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="py-6">
                <Link href={`/projects/${project.slug}/settings`}>
                  <Button>Go to Project Settings</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
