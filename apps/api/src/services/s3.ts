import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const canUseAwsCredentials = Boolean(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY);

const s3 = new S3Client({
  region: config.AWS_REGION,
  ...(canUseAwsCredentials
    ? {
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID!,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY!
        }
      }
    : {}),
  ...(config.AWS_S3_ENDPOINT ? { endpoint: config.AWS_S3_ENDPOINT } : {}),
  ...(config.AWS_S3_FORCE_PATH_STYLE ? { forcePathStyle: true } : {})
});

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function getSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function isLocalStorageKey(key: string): boolean {
  return key.startsWith("local://");
}

export function toLocalStoragePath(key: string): string {
  const relative = key.replace(/^local:\/\//, "");
  return path.resolve(config.LOCAL_UPLOAD_DIR, relative);
}

export async function getS3ReportObject(key: string) {
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
    const finalPath = path.join(config.LOCAL_UPLOAD_DIR, key);
    await mkdir(path.dirname(finalPath), { recursive: true });
    await writeFile(finalPath, buffer);
    return `local://${key}`;
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
