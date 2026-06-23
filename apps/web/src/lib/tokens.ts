import { createHash, randomBytes } from "crypto";

export function generateToken(): string {
  return "pst_" + randomBytes(24).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}
