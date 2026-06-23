"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTransition } from "@/components/shared/page-transition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/server/actions/projects";
import { toast } from "sonner";
import Link from "next/link";

interface ProjectWithRuns {
  id: string;
  name: string;
  slug: string;
  runs: { status: string; createdAt: Date }[];
  environments: { name: string; slug: string }[];
  _count: { runs: number };
}

interface ProjectsPageProps {
  projects: ProjectWithRuns[];
}

export function ProjectsList({ projects }: ProjectsPageProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      await createProject(formData);
      toast.success("Project created");
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Projects
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your test projects and environments.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Give your project a name. You can always change it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  placeholder="My Test Suite"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                  {loading ? "Creating..." : "Create project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={<FolderKanban className="h-12 w-12" />}
                title="No projects yet"
                description="Create your first project to start tracking test runs."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const lastRun = project.runs[0];
              return (
                <Link key={project.id} href={`/projects/${project.slug}`}>
                  <Card className="hover:bg-surface-2 transition-colors cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold text-foreground">
                            {project.name}
                          </h3>
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
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{project._count.runs} runs</span>
                        <span>{project.environments.length} environments</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {project.environments.map((env) => (
                          <Badge
                            key={env.slug}
                            variant="outline"
                            className="text-xs"
                          >
                            {env.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
