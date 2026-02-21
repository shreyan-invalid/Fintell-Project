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
  DEMO_USERNAME: z.string().default("demo"),
  DEMO_PASSWORD: z.string().default("Demo@1234"),
  S3_BUCKET: z.string().min(1),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  DEFAULT_TENANT_SLUG: z.string().default("tenant-1"),
  AUTH_MODE: z.enum(["optional", "required"]).default("optional")
});

export const config = schema.parse(process.env);
