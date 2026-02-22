import { z } from "zod";

const boolFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const schema = z
  .object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(4000),

    DATABASE_URL: z
      .string()
      .default("postgresql://postgres:postgres@postgres:5432/finintel?schema=public"),
    REDIS_URL: z.string().default("redis://redis:6379"),

    AUTH_MODE: z.enum(["required", "optional", "disabled"]).default("required"),
    AUTH_DEBUG: boolFromString,

    JWT_ISSUER: z.string().default("http://localhost:8080/realms/finintel"),
    JWT_AUDIENCE: z.string().default("finintel-api"),
    KEYCLOAK_JWKS_URI: z
      .string()
      .default("http://keycloak:8080/realms/finintel/protocol/openid-connect/certs"),

    KEYCLOAK_TOKEN_URL: z
      .string()
      .default("http://keycloak:8080/realms/finintel/protocol/openid-connect/token"),
    KEYCLOAK_CLIENT_ID: z.string().default("finintel-api"),
    KEYCLOAK_CLIENT_SECRET: z.string().default("api-secret"),

    OIDC_CLIENT_ID: z.string().default("finintel-web"),
    DEFAULT_TENANT_SLUG: z.string().default("tenant-1"),
    DEMO_USERNAME: z.string().default("demo"),
    DEMO_PASSWORD: z.string().default("Demo@1234"),

    STORAGE_MODE: z.enum(["s3", "local"]).default("local"),
    S3_BUCKET: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_ENDPOINT: z.string().optional(),
    AWS_S3_FORCE_PATH_STYLE: boolFromString,
    LOCAL_UPLOAD_DIR: z.string().default("./data/uploads"),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_MODE === "s3" && !(env.S3_BUCKET || env.AWS_S3_BUCKET)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["S3_BUCKET"],
        message: "S3 bucket is required when STORAGE_MODE=s3",
      });
    }
  });

const parsed = schema.parse(process.env);

export const config = {
  ...parsed,
  S3_BUCKET: parsed.S3_BUCKET ?? parsed.AWS_S3_BUCKET ?? "",
};
