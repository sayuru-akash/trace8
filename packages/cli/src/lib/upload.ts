import { readFile } from "fs/promises";

export async function uploadArtifact(
  uploadUrl: string,
  filePath: string,
  mimeType: string,
  baseUrl?: string
): Promise<void> {
  const data = await readFile(filePath);

  const fullUrl = uploadUrl.startsWith("/") && baseUrl
    ? `${baseUrl}${uploadUrl}`
    : uploadUrl;

  const response = await fetch(fullUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(data.length),
    },
    body: data,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to upload artifact: ${response.status} ${text}`
    );
  }
}
