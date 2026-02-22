import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: process.env.ENV_FILE ?? "../../.env" });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ISSUER: z.string().url(),
  JWT_AUDIENCE: z.string().min(1),
  KEYCLOAK_JWKS_URI: z.string().url(),
  KEYCLOAK_TOKEN_URL: z.string().url().default("http://localhost:8080/realms/finintel/protocol/openid-connect/token"),
  KEYCLOAK_CLIENT_ID: z.string().default("finintel-api"),
  KEYCLOAK_CLIENT_SECRET: z.string().default("api-secret"),
  OIDC_CLIENT_ID: z.string().default("finintel-api"),
  DEMO_USERNAME: z.string().default("demo"),
  DEMO_PASSWORD: z.string().default("Demo@1234"),
  STORAGE_MODE: z.enum(["s3", "local"]).default("local"),
  S3_BUCKET: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1).optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_ENDPOINT: z.string().optional().transform((v) => (v && v.trim() ? v : undefined)).pipe(z.string().url().optional()),
  AWS_S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
  LOCAL_UPLOAD_DIR: z.string().default("/tmp/finintel-uploads"),
  DEFAULT_TENANT_SLUG: z.string().default("tenant-1"),
  AUTH_MODE: z.enum(["optional", "required"]).default("required"),
  AUTH_DEBUG: z.coerce.boolean().default(false)
});

const parsed = schema.parse(process.env);

export const config = {
  ...parsed,
  S3_BUCKET: parsed.S3_BUCKET || parsed.AWS_S3_BUCKET || ""
};
