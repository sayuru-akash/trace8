import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shield, Users, Building2, FolderKanban, PlayCircle, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageTransition } from "@/components/shared/page-transition";
import { StatCard } from "@/components/shared/stat-card";
import { AiConfig } from "@/components/admin/ai-config";
import { formatBytes } from "@/lib/utils";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, orgs, projects, runs] = await Promise.all([
    db.user.count(),
    db.org.count(),
    db.project.count(),
    db.run.count(),
  ]);

  const storageResult = await db.artifact.aggregate({
    _sum: { sizeBytes: true },
  });

  const storageBytes = storageResult._sum.sizeBytes
    ? Number(storageResult._sum.sizeBytes)
    : 0;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            System administration and configuration.
          </p>
        </div>

        {/* System Stats */}
        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
            <CardDescription>Overview of the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <p className="text-sm">Users</p>
                </div>
                <p className="mt-1 text-2xl font-bold font-display">{users}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <p className="text-sm">Organizations</p>
                </div>
                <p className="mt-1 text-2xl font-bold font-display">{orgs}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FolderKanban className="h-4 w-4" />
                  <p className="text-sm">Projects</p>
                </div>
                <p className="mt-1 text-2xl font-bold font-display">{projects}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PlayCircle className="h-4 w-4" />
                  <p className="text-sm">Total Runs</p>
                </div>
                <p className="mt-1 text-2xl font-bold font-display">{runs}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="h-4 w-4" />
                  <p className="text-sm">Storage</p>
                </div>
                <p className="mt-1 text-2xl font-bold font-display">
                  {formatBytes(storageBytes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <AiConfig />
      </div>
    </PageTransition>
  );
}
