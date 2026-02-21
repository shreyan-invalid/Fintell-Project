import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { config } from "../config.js";

const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  }
});

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function getSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
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
