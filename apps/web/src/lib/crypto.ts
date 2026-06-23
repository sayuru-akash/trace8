import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default-dev-key-32bytes!!";
  return scryptSync(secret, "trace8-salt", KEY_LENGTH);
}

export function encrypt(text: string): string {
  const key = getKey();
  const ivBuf = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, ivBuf);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([ivBuf, authTag, encrypted]).toString("base64");
}

export function decrypt(encryptedData: string): string {
  const key = getKey();
  const data = Buffer.from(encryptedData, "base64");
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
