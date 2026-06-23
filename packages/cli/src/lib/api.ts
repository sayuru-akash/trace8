const DEFAULT_TIMEOUT = 30_000;

export async function post(
  url: string,
  body: unknown,
  token?: string,
  timeout = DEFAULT_TIMEOUT
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function validateToken(apiUrl: string, token: string) {
  return post(`${apiUrl}/api/ingest/validate-token`, {}, token) as Promise<{
    valid: boolean;
    projectId?: string;
    projectName?: string;
    orgSlug?: string;
    environments?: string[];
  }>;
}

export async function createRun(apiUrl: string, token: string, payload: unknown) {
  return post(`${apiUrl}/api/ingest/runs`, payload, token, 60_000) as Promise<{
    runId: string;
    runUrl: string;
    artifactUploads: {
      artifactKey: string;
      uploadUrl: string;
      storageKey: string;
      expiresAt: string;
    }[];
  }>;
}

export async function finaliseRun(
  apiUrl: string,
  token: string,
  runId: string,
  payload: unknown
) {
  return post(
    `${apiUrl}/api/ingest/runs/${runId}/finalise`,
    payload,
    token
  ) as Promise<{ ok: boolean; runUrl: string }>;
}

export async function markUploadFailed(
  apiUrl: string,
  token: string,
  runId: string
) {
  return post(
    `${apiUrl}/api/ingest/runs/${runId}/upload-failed`,
    {},
    token
  ) as Promise<{ ok: boolean }>;
}
