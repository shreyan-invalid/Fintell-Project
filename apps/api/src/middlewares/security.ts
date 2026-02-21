import type { RequestHandler } from "express";
import helmet from "helmet";

export const securityMiddleware: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:"]
      }
    },
    crossOriginResourcePolicy: { policy: "same-site" }
  })
];
