"use client";

import * as React from "react";
import { Settings, Save, Loader2, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion } from "motion/react";
import {
  saveAiConfig,
  getAiConfig,
  testAiConnection,
} from "@/server/actions/admin";
import { toast } from "sonner";

interface AiConfigData {
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  enabled: boolean;
}

export function AiConfig() {
  const [config, setConfig] = React.useState<AiConfigData>({
    provider: "openai",
    apiKey: "",
    apiUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    enabled: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [showApiKey, setShowApiKey] = React.useState(false);

  React.useEffect(() => {
    async function loadConfig() {
      try {
        const data = await getAiConfig();
        setConfig(data);
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveAiConfig(config);
      toast.success("AI configuration saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    try {
      const result = await testAiConnection();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection test failed");
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
              <Settings className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Configure the AI provider for test analysis and insights.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {config.enabled ? "Enabled" : "Disabled"}
            </span>
            <button
              onClick={() =>
                setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? "bg-primary" : "bg-surface-2"
              }`}
            >
              <motion.span
                animate={{ x: config.enabled ? 20 : 2 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ai-provider">Provider</Label>
          <select
            id="ai-provider"
            value={config.provider}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, provider: e.target.value }))
            }
            className="flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="openai">OpenAI</option>
            <option value="openai-compatible">OpenAI Compatible</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-api-url">API Endpoint URL</Label>
          <Input
            id="ai-api-url"
            type="url"
            placeholder="https://api.openai.com/v1"
            value={config.apiUrl}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, apiUrl: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-api-key">API Key</Label>
          <div className="relative">
            <Input
              id="ai-api-key"
              type={showApiKey ? "text" : "password"}
              placeholder="sk-..."
              value={config.apiKey}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              }
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your API key is encrypted before storage.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-model">Model</Label>
          <Input
            id="ai-model"
            type="text"
            placeholder="gpt-4o"
            value={config.model}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, model: e.target.value }))
            }
          />
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
            onClick={handleTestConnection}
            disabled={testing || !config.apiKey}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plug className="h-4 w-4" />
            )}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
