import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { prisma } from "../db/prisma.js";

type PrismaErrorLike = {
  code?: string;
};

function isMissingTableError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as PrismaErrorLike).code === "P2021";
}

async function ensureDefaultTenant(): Promise<string | null> {
  if (config.AUTH_MODE === "required") return null;

  try {
    const tenant = await prisma.tenant.upsert({
      where: { slug: config.DEFAULT_TENANT_SLUG },
      update: {},
      create: {
        name: "Default Tenant",
        slug: config.DEFAULT_TENANT_SLUG,
        keycloakRealmId: config.DEFAULT_TENANT_SLUG
      },
      select: { id: true }
    });
    return tenant.id;
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

async function resolveTenantId(tenantHint?: string): Promise<string | null> {
  try {
    if (tenantHint) {
      const byHint = await prisma.tenant.findFirst({
        where: { OR: [{ id: tenantHint }, { slug: tenantHint }] },
        select: { id: true }
      });
      if (byHint) return byHint.id;
    }

    if (config.AUTH_MODE === "required") return null;

    const byDefaultSlug = await prisma.tenant.findFirst({
      where: { slug: config.DEFAULT_TENANT_SLUG },
      select: { id: true }
    });
    if (byDefaultSlug) return byDefaultSlug.id;

    const firstTenant = await prisma.tenant.findFirst({ select: { id: true } });
    if (firstTenant) return firstTenant.id;

    return ensureDefaultTenant();
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

export async function requireTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantHint = req.header("x-tenant-id");

    if (req.user?.tenantId) {
      const tenantId = await resolveTenantId(req.user.tenantId);
      if (!tenantId) {
        if (config.AUTH_MODE === "optional") {
          res.locals.tenantId = "";
          next();
          return;
        }
        res.status(503).json({ error: "Database not initialized" });
        return;
      }
      req.user.tenantId = tenantId;
      res.locals.tenantId = tenantId;
      next();
      return;
    }

    const tenantId = await resolveTenantId(tenantHint ?? undefined);
    if (!tenantId) {
      if (config.AUTH_MODE === "optional") {
        res.locals.tenantId = "";
        next();
        return;
      }
      res.status(400).json({ error: "Invalid tenant context" });
      return;
    }

    res.locals.tenantId = tenantId;
    next();
  } catch (error) {
    next(error);
  }
}
