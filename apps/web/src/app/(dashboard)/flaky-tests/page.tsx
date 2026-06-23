import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FlakeClassification } from "@/generated/prisma/client";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { FlakeScoreBar } from "@/components/flaky/flake-score-bar";
import { PassFailDots } from "@/components/flaky/pass-fail-dots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileSearch } from "lucide-react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

const classificationBadge = {
  stable: { variant: "success" as const, label: "Stable" },
  watch: { variant: "info" as const, label: "Watch" },
  flaky: { variant: "warning" as const, label: "Flaky" },
  regression: { variant: "danger" as const, label: "Regression" },
};

const suggestedAction = (classification: string) => {
  switch (classification) {
    case "flaky":
      return { label: "Investigate", variant: "warning" as const };
    case "regression":
      return { label: "Urgent", variant: "danger" as const };
    case "watch":
      return { label: "Monitor", variant: "info" as const };
    default:
      return { label: "Stable now", variant: "success" as const };
  }
};

export default async function FlakyTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; project?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 20;

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

  const flakyClassifications = ["flaky", "watch", "regression"] as FlakeClassification[];

  const baseFilter = {
    project: { orgId: orgMember.orgId },
    classification: { in: flakyClassifications },
  };

  const findManyWhere = params.project
    ? { ...baseFilter, projectId: params.project }
    : baseFilter;

  const [stats, totalCount, projects] = await Promise.all([
    db.flakyTestStat.findMany({
      where: findManyWhere,
      include: {
        test: true,
        project: { select: { name: true, slug: true } },
      },
      orderBy: { flakeScore: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.flakyTestStat.count({ where: findManyWhere }),
    db.project.findMany({
      where: { orgId: orgMember.orgId, archivedAt: null },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Flaky Tests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tests that show unstable behavior across recent runs.
            </p>
          </div>
          <Badge variant="warning">{totalCount} detected</Badge>
        </div>

        {/* Project filter */}
        {projects.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/flaky-tests"
              className={`rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-surface-2 ${
                !params.project ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              All projects
            </Link>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/flaky-tests?project=${p.id}`}
                className={`rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-surface-2 ${
                  params.project === p.id ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}

        {stats.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12" />}
                title="No flaky tests"
                description="Once test runs are synced, flaky tests will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Ranked by Flake Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.map((stat) => {
                  const action = suggestedAction(stat.classification);
                  const badge = classificationBadge[stat.classification];
                  return (
                    <Link
                      key={stat.id}
                      href={`/tests/${stat.testId}`}
                      className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-surface-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-sm">
                            {stat.test.titlePath.join(" › ")}
                          </span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <FileSearch className="h-3 w-3" />
                          <span className="truncate font-mono">{stat.test.filePath}</span>
                          {stat.project.name && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5">
                              {stat.project.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <FlakeScoreBar
                        score={stat.flakeScore}
                        classification={stat.classification}
                      />
                      <div className="hidden md:block">
                        <Badge variant={action.variant}>{action.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/flaky-tests?page=${page - 1}${params.project ? `&project=${params.project}` : ""}`}
                        className="rounded border border-border px-3 py-1 text-xs hover:bg-surface-2"
                      >
                        ← Prev
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/flaky-tests?page=${page + 1}${params.project ? `&project=${params.project}` : ""}`}
                        className="rounded border border-border px-3 py-1 text-xs hover:bg-surface-2"
                      >
                        Next →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
