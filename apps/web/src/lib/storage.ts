import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { LIMITS } from "@trace8/shared";

// ============================================================
// STORAGE ADAPTER INTERFACE
// ============================================================

export interface SignedUploadUrl {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

export interface SignedReadUrl {
  readUrl: string;
  expiresAt: Date;
}

export interface StorageAdapter {
  getSignedUploadUrl(
    orgId: string,
    projectId: string,
    runId: string,
    artifactKey: string,
    fileName: string,
    mimeType: string,
    sizeBytes: number
  ): Promise<SignedUploadUrl>;
  getSignedReadUrl(storageKey: string): Promise<SignedReadUrl>;
  deleteObject(storageKey: string): Promise<void>;
}

// ============================================================
// LOCAL ADAPTER (Development)
// ============================================================

export class LocalStorageAdapter implements StorageAdapter {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.env.STORAGE_LOCAL_PATH || "./storage";
  }

  async getSignedUploadUrl(
    orgId: string,
    projectId: string,
    runId: string,
    artifactKey: string,
    fileName: string,
    mimeType: string,
    sizeBytes: number
  ): Promise<SignedUploadUrl> {
    const storageKey = `${orgId}/${projectId}/${runId}/${artifactKey}/${fileName}`;
    const fullPath = path.join(this.basePath, storageKey);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // In local mode, the "signed URL" is just the internal API endpoint
    const uploadUrl = `/api/storage/upload?key=${encodeURIComponent(storageKey)}&token=${this.generateToken(storageKey)}`;

    return {
      uploadUrl,
      storageKey,
      expiresAt: new Date(Date.now() + LIMITS.SIGNED_URL_EXPIRY_MINUTES * 60_000),
    };
  }

  async getSignedReadUrl(storageKey: string): Promise<SignedReadUrl> {
    const readUrl = `/api/storage/read?key=${encodeURIComponent(storageKey)}&token=${this.generateToken(storageKey)}`;
    return {
      readUrl,
      expiresAt: new Date(Date.now() + LIMITS.SIGNED_URL_EXPIRY_MINUTES * 60_000),
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    const fullPath = path.join(this.basePath, storageKey);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  async writeFile(storageKey: string, data: Buffer): Promise<void> {
    const fullPath = path.join(this.basePath, storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  async readFile(storageKey: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, storageKey);
    return fs.readFile(fullPath);
  }

  async getFileSize(storageKey: string): Promise<number> {
    const fullPath = path.join(this.basePath, storageKey);
    const stat = await fs.stat(fullPath);
    return stat.size;
  }

  private generateToken(storageKey: string): string {
    return createHash("sha256")
      .update(storageKey + process.env.ENCRYPTION_KEY)
      .digest("hex")
      .substring(0, 32);
  }

  verifyToken(storageKey: string, token: string): boolean {
    return this.generateToken(storageKey) === token;
  }
}

// ============================================================
// R2/S3 ADAPTER (Production — stub for now)
// ============================================================

export class R2StorageAdapter implements StorageAdapter {
  // TODO: implement with S3 SDK when deploying to production
  // Uses @aws-sdk/client-s3 with R2 endpoint

  async getSignedUploadUrl(): Promise<SignedUploadUrl> {
    throw new Error("R2StorageAdapter not yet configured");
  }
  async getSignedReadUrl(): Promise<SignedReadUrl> {
    throw new Error("R2StorageAdapter not yet configured");
  }
  async deleteObject(): Promise<void> {
    throw new Error("R2StorageAdapter not yet configured");
  }
}

// ============================================================
// FACTORY
// ============================================================

let _adapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!_adapter) {
    const driver = process.env.STORAGE_DRIVER || "local";
    if (driver === "r2" || driver === "s3") {
      _adapter = new R2StorageAdapter();
    } else {
      _adapter = new LocalStorageAdapter();
    }
  }
  return _adapter;
}

export function getLocalStorage(): LocalStorageAdapter {
  const adapter = getStorage();
  if (!(adapter instanceof LocalStorageAdapter)) {
    throw new Error("Expected LocalStorageAdapter but got different type");
  }
  return adapter;
}
