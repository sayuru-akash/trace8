import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { FlaskConical, Search } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 30;

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; project?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session!.user!.id },
  });

  if (!orgMember) {
    return (
      <PageTransition>
        <EmptyState title="No organization" description="Join or create an organization." />
      </PageTransition>
    );
  }

  const projects = await db.project.findMany({
    where: { orgId: orgMember.orgId, archivedAt: null },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const projectFilter = params.project
    ? projects.find((p) => p.slug === params.project)?.id
    : undefined;

  const where = {
    projectId: projectFilter ? projectFilter : { in: projects.map((p) => p.id) },
  };

  const [tests, totalCount] = await Promise.all([
    db.test.findMany({
      where,
      include: {
        results: {
          include: { run: { select: { id: true, createdAt: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        flakyStats: { take: 1 },
        project: { select: { name: true, slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.test.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Tests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse all discovered tests and their latest results.
          </p>
        </div>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FlaskConical className="h-12 w-12" />}
                title="No tests discovered"
                description="Tests will appear here after your first run. Use the CLI to run your Playwright suite."
                action={{ label: "View Projects", href: "/projects" }}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Project filter */}
            {projects.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/tests">
                  <Button
                    variant={!params.project ? "default" : "outline"}
                    size="sm"
                  >
                    All
                  </Button>
                </Link>
                {projects.map((project) => (
                  <Link key={project.id} href={`/tests?project=${project.slug}`}>
                    <Button
                      variant={params.project === project.slug ? "default" : "outline"}
                      size="sm"
                    >
                      {project.name}
                    </Button>
                  </Link>
                ))}
              </div>
            )}

            {/* Tests list */}
            <div className="space-y-2">
              {tests.map((test) => {
                const lastResult = test.results[0];
                const flakyStat = test.flakyStats[0];

                return (
                  <Link
                    key={test.id}
                    href={`/tests/${test.id}${lastResult ? `?runId=${lastResult.runId}` : ""}`}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {lastResult ? (
                        <Badge
                          variant={
                            lastResult.status === "passed" ? "success" :
                            lastResult.status === "failed" ? "danger" :
                            lastResult.status === "flaky" ? "warning" :
                            lastResult.status === "skipped" ? "outline" : "outline"
                          }
                          className="shrink-0"
                        >
                          {lastResult.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0">unknown</Badge>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {test.titlePath.join(" › ")}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {test.filePath}
                          {test.browserProjectName && ` · ${test.browserProjectName}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {flakyStat && flakyStat.classification !== "stable" && (
                        <Badge
                          variant={
                            flakyStat.classification === "flaky" ? "warning" :
                            flakyStat.classification === "regression" ? "danger" : "info"
                          }
                          className="text-xs"
                        >
                          {flakyStat.classification}
                        </Badge>
                      )}
                      {lastResult && (
                        <span className="text-xs text-muted-foreground">
                          {lastResult.durationMs}ms
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {test.project.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link href={`/tests?page=${page - 1}${params.project ? `&project=${params.project}` : ""}`}>
                      <Button variant="outline" size="sm">Previous</Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/tests?page=${page + 1}${params.project ? `&project=${params.project}` : ""}`}>
                      <Button variant="outline" size="sm">Next</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
