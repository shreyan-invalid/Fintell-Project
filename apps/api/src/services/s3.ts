import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";
import { config } from "../config.js";

const s3Config: S3ClientConfig = {
  region: config.AWS_REGION,
};

if (config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  };
}

if (config.AWS_S3_ENDPOINT) s3Config.endpoint = config.AWS_S3_ENDPOINT;
if (config.AWS_S3_FORCE_PATH_STYLE) s3Config.forcePathStyle = true;

export const s3 = new S3Client(s3Config);
