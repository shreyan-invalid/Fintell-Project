import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const LOCAL_PREFIX = "local://";

const s3 =
  config.STORAGE_MODE === "s3"
    ? new S3Client({
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY
        }
      })
    : null;

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function getSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function isLocalStorageKey(storageKey: string): boolean {
  return storageKey.startsWith(LOCAL_PREFIX);
}

export function toLocalStoragePath(storageKey: string): string {
  if (!isLocalStorageKey(storageKey)) {
    throw new Error("Not a local storage key");
  }

  const relativeKey = storageKey.slice(LOCAL_PREFIX.length);
  const base = path.resolve(config.LOCAL_UPLOAD_DIR);
  const resolved = path.resolve(base, relativeKey);

  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error("Invalid local storage key path");
  }

  return resolved;
}

export async function getS3ReportObject(key: string) {
  if (!s3) {
    throw new Error("S3 client not initialized");
  }

  return s3.send(
    new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key
    })
  );
}

export async function uploadReport(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  tenantId: string,
  uploadedBy: string
): Promise<string> {
  const safeName = sanitizeFileName(fileName);
  const checksum = getSha256(buffer);
  const key = `${tenantId}/${Date.now()}-${safeName}`;

  if (config.STORAGE_MODE === "local") {
    const destination = path.join(config.LOCAL_UPLOAD_DIR, key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, buffer);
    return `local://${key}`;
  }

  if (!s3) {
    throw new Error("S3 client not initialized");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ChecksumSHA256: checksum,
      ServerSideEncryption: "AES256",
      Metadata: {
        tenantid: tenantId,
        uploadedby: uploadedBy,
        checksum
      }
    })
  );

  return key;
}
