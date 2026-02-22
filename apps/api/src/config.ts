import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(4000),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    AUTH_MODE: z.enum(["required", "optional", "disabled"]).default("required"),
    AUTH_DEBUG: z
      .string()
      .optional()
      .transform((v) => v === "true"),

    JWT_ISSUER: z.string().optional(),
    JWT_AUDIENCE: z.string().optional(),
    KEYCLOAK_JWKS_URI: z.string().optional(),

    KEYCLOAK_TOKEN_URL: z.string().optional(),
    KEYCLOAK_CLIENT_ID: z.string().optional(),
    KEYCLOAK_CLIENT_SECRET: z.string().optional(),

    STORAGE_MODE: z.enum(["s3", "local"]).default("local"),
    S3_BUCKET: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_ENDPOINT: z.string().optional(),
    AWS_S3_FORCE_PATH_STYLE: z
      .string()
      .optional()
      .transform((v) => v === "true"),

    LOCAL_UPLOAD_DIR: z.string().default("./data/uploads"),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_MODE === "s3") {
      const bucket = env.S3_BUCKET ?? env.AWS_S3_BUCKET;
      if (!bucket) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["S3_BUCKET"],
          message: "S3 bucket is required when STORAGE_MODE=s3",
        });
      }
    }
  });

const parsed = schema.parse(process.env);

export const config = {
  ...parsed,
  AUTH_DEBUG: parsed.AUTH_DEBUG ?? false,
  S3_BUCKET: parsed.S3_BUCKET ?? parsed.AWS_S3_BUCKET ?? "",
  AWS_S3_FORCE_PATH_STYLE: parsed.AWS_S3_FORCE_PATH_STYLE ?? false,
};
