"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Send, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import { saveAlertConfig, getAlertConfig, testAlert } from "@/server/actions/alerts";
import { toast } from "sonner";

interface AlertRule {
  type: string;
  label: string;
  description: string;
}

const ALERT_RULES: AlertRule[] = [
  {
    type: "failed_production_run",
    label: "Failed Production Run",
    description: "Alert when a run fails in the production environment.",
  },
  {
    type: "new_failing_test",
    label: "New Failing Test",
    description: "Alert when a previously passing test starts failing.",
  },
  {
    type: "failure_spike",
    label: "Failure Spike",
    description: "Alert when failures exceed 2x the average of last 5 runs.",
  },
  {
    type: "flaky_test_spike",
    label: "Flaky Test Spike",
    description: "Alert when new flaky tests are detected.",
  },
];

interface AlertConfigProps {
  projectId: string;
  projectName: string;
}

export function AlertConfig({ projectId, projectName }: AlertConfigProps) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(false);
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [selectedRules, setSelectedRules] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    async function loadConfig() {
      try {
        const config = await getAlertConfig(projectId);
        setEnabled(config.enabled);
        setWebhookUrl(config.webhookUrl);
        setSelectedRules(config.rules.map((r) => r.type));
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [projectId]);

  function toggleRule(type: string) {
    setSelectedRules((prev) =>
      prev.includes(type) ? prev.filter((r) => r !== type) : [...prev, type]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveAlertConfig(projectId, {
        enabled,
        webhookUrl: webhookUrl || undefined,
        rules: selectedRules.map((type) => ({ type })),
      });
      toast.success("Alert configuration saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      await testAlert(projectId);
      toast.success("Test alert sent to Slack");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test alert");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {projectName}
            </CardTitle>
            <CardDescription>
              Configure Slack alerts for this project.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? "bg-primary" : "bg-surface-2"
              }`}
            >
              <motion.span
                animate={{ x: enabled ? 20 : 2 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`webhook-${projectId}`}>Slack Webhook URL</Label>
          <Input
            id={`webhook-${projectId}`}
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Create an incoming webhook in your Slack workspace settings.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Alert Rules</Label>
          {ALERT_RULES.map((rule) => (
            <label
              key={rule.type}
              className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface-2 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedRules.includes(rule.type)}
                onChange={() => toggleRule(rule.type)}
                className="mt-0.5 h-4 w-4 rounded border-border"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {rule.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rule.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !webhookUrl}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Test Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
