"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, EyeOff, RotateCcw, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/page-transition";
import { createToken, revokeToken, rotateToken } from "@/server/actions/tokens";
import { archiveProject } from "@/server/actions/projects";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

interface Token {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

interface ProjectSettingsProps {
  project: {
    id: string;
    name: string;
    slug: string;
    environments: { id: string; name: string; slug: string }[];
    tokens: Token[];
    _count: { runs: number; tests: number };
  };
  usage: {
    runsThisMonth: number;
    storageUsed: string;
  };
}

export function ProjectSettings({ project, usage }: ProjectSettingsProps) {
  const router = useRouter();
  const [tokenDialogOpen, setTokenDialogOpen] = React.useState(false);
  const [tokenName, setTokenName] = React.useState("");
  const [newToken, setNewToken] = React.useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleCreateToken() {
    if (!tokenName.trim()) return;
    setLoading(true);
    try {
      const token = await createToken(project.id, tokenName);
      setNewToken(token);
      setTokenName("");
      toast.success("Token created");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeToken(tokenId: string) {
    try {
      await revokeToken(tokenId);
      toast.success("Token revoked");
      router.refresh();
    } catch {
      toast.error("Failed to revoke token");
    }
  }

  async function handleRotateToken(tokenId: string, name: string) {
    try {
      const token = await rotateToken(tokenId, project.id, name);
      setNewToken(token);
      toast.success("Token rotated");
      router.refresh();
    } catch {
      toast.error("Failed to rotate token");
    }
  }

  function copyToken() {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  }

  async function handleArchive() {
    try {
      await archiveProject(project.id);
      toast.success("Project archived");
      router.push("/projects");
    } catch {
      toast.error("Failed to archive project");
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage {project.name} settings and tokens.
          </p>
        </div>

        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic project information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input defaultValue={project.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input defaultValue={project.slug} disabled />
              <p className="text-xs text-muted-foreground">
                Used in URLs and CLI commands.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tokens */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>
                  Used to authenticate the Trace8 CLI.
                </CardDescription>
              </div>
              <Dialog
                open={tokenDialogOpen}
                onOpenChange={(open) => {
                  setTokenDialogOpen(open);
                  if (!open) setNewToken(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Create Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {newToken ? "Token Created" : "Create API Token"}
                    </DialogTitle>
                    <DialogDescription>
                      {newToken
                        ? "Copy this token now. It won't be shown again."
                        : "Give your token a descriptive name."}
                    </DialogDescription>
                  </DialogHeader>

                  {newToken ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                        <p className="text-sm text-warning">
                          Make sure to copy this token now. You won&apos;t be
                          able to see it again.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-surface-2 p-3 text-sm font-mono break-all">
                          {newToken}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyToken}
                        >
                          {tokenCopied ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input
                        id="token-name"
                        placeholder="e.g., CI Pipeline"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateToken()}
                      />
                    </div>
                  )}

                  <DialogFooter>
                    {!newToken && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setTokenDialogOpen(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateToken}
                          disabled={loading || !tokenName.trim()}
                        >
                          {loading ? "Creating..." : "Create"}
                        </Button>
                      </>
                    )}
                    {newToken && (
                      <Button onClick={() => setTokenDialogOpen(false)}>
                        Done
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {project.tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tokens created yet. Create one to authenticate the CLI.
              </p>
            ) : (
              <div className="space-y-3">
                {project.tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{token.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {token.createdAt.toLocaleDateString()}
                        {token.lastUsedAt &&
                          ` · Last used ${token.lastUsedAt.toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleRotateToken(token.id, token.name)
                        }
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-danger"
                        onClick={() => handleRevokeToken(token.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environments */}
        <Card>
          <CardHeader>
            <CardTitle>Environments</CardTitle>
            <CardDescription>
              Manage test environments for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.environments.map((env) => (
                <div
                  key={env.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{env.name}</span>
                    <code className="text-xs text-muted-foreground">
                      {env.slug}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Current month usage statistics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Runs This Month</p>
                <p className="text-2xl font-bold font-display">
                  {usage.runsThisMonth}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold font-display">
                  {formatBytes(BigInt(usage.storageUsed))}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Retention Period</p>
                <p className="text-2xl font-bold font-display">14 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger/30">
          <CardHeader>
            <CardTitle className="text-danger">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-danger/20 p-4">
              <div>
                <p className="font-medium text-foreground">Archive Project</p>
                <p className="text-sm text-muted-foreground">
                  Hide this project and stop accepting new runs.
                </p>
              </div>
              <Button variant="destructive" onClick={handleArchive}>
                Archive
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
