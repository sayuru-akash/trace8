"use client";

import { useState, useEffect } from "react";
import { ScreenshotLightbox } from "./screenshot-lightbox";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2 } from "lucide-react";

export function ArtifactDisplay({
  artifactId,
  type,
  fileName,
  sizeBytes,
}: {
  artifactId: string;
  type: string;
  fileName: string;
  sizeBytes: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchUrl() {
    setLoading(true);
    try {
      const res = await fetch(`/api/artifacts/${artifactId}/signed-url`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setUrl(data.readUrl);
      }
    } finally {
      setLoading(false);
    }
  }

  if (type === "screenshot") {
    return (
      <ScreenshotArtifact
        artifactId={artifactId}
        fileName={fileName}
        sizeBytes={sizeBytes}
      />
    );
  }

  if (type === "trace") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(sizeBytes)} · Trace file
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUrl}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
          {url && (
            <a
              href={`https://trace.playwright.dev/?trace=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
                View Trace
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {fileName}
        </p>
        <p className="text-xs text-muted-foreground">{formatBytes(sizeBytes)}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={fetchUrl}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download
      </Button>
    </div>
  );
}

function ScreenshotArtifact({
  artifactId,
  fileName,
  sizeBytes,
}: {
  artifactId: string;
  fileName: string;
  sizeBytes: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchUrl() {
      try {
        const res = await fetch(`/api/artifacts/${artifactId}/signed-url`, {
          method: "POST",
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setUrl(data.readUrl);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUrl();
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-surface-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-surface-2">
        <p className="text-sm text-muted-foreground">
          Failed to load screenshot
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ScreenshotLightbox
        src={url}
        alt={fileName}
        className="max-h-96 w-full object-contain"
      />
      <p className="text-xs text-muted-foreground">
        {fileName} · {formatBytes(sizeBytes)}
      </p>
    </div>
  );
}
