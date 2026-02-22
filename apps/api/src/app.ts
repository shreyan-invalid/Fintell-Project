import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { config } from "./config.js";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { authenticate, authenticateOptional } from "./middlewares/auth.js";
import { rateLimit } from "./middlewares/rateLimit.js";
import { securityMiddleware } from "./middlewares/security.js";
import { requireTenant } from "./middlewares/tenant.js";
import { authRouter } from "./routes/auth.js";
import { financialRouter } from "./routes/financial.js";
import { healthRouter } from "./routes/health.js";
import { oidcRouter } from "./routes/oidc.js";
import { tenantsRouter } from "./routes/tenants.js";
import { uploadRouter } from "./routes/upload.js";

export async function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(securityMiddleware);
  app.get("/", (_req, res) => {
    res.send("hello world");
  });
  app.use(healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/oidc", oidcRouter);
  app.use("/api/tenants", authenticate, rateLimit, tenantsRouter);

  const authMiddleware = config.AUTH_MODE === "required" ? authenticate : authenticateOptional;
  app.use("/api/v1", authMiddleware, rateLimit, requireTenant);
  app.use("/api/v1/financial", financialRouter);
  app.use("/api/v1/reports", uploadRouter);

  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();

  app.use(
    "/graphql",
    authenticate,
    requireTenant,
    expressMiddleware(apollo, {
      context: async ({ req }) => ({ tenantId: (req as express.Request).user?.tenantId ?? "" })
    })
  );

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "Unsupported file type") {
      res.status(400).json({ error: message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
