import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import { AlertConfig } from "@/components/alerts/alert-config";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const orgMember = await db.orgMember.findFirst({
    where: { userId: session.user.id },
  });

  if (!orgMember) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Alerts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure alerts for test failures and flaky tests.
            </p>
          </div>
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="No organization"
            description="Join or create an organization to configure alerts."
          />
        </div>
      </PageTransition>
    );
  }

  const projects = await db.project.findMany({
    where: { orgId: orgMember.orgId, archivedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure Slack alerts for test failures and flaky tests.
          </p>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-12 w-12" />}
            title="No projects"
            description="Create a project first to configure alerts."
          />
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <AlertConfig
                key={project.id}
                projectId={project.id}
                projectName={project.name}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
