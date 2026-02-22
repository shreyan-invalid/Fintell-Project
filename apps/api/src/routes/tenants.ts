import { Router } from "express";
import { prisma } from "../db/prisma.js";

export const tenantsRouter = Router();

type PrismaErrorLike = {
  code?: string;
};

function isMissingTableError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as PrismaErrorLike).code === "P2021";
}

tenantsRouter.get("/", async (_req, res) => {
  try {
    const tenantModel = (prisma as unknown as {
      tenant?: {
        findMany?: (args: unknown) => Promise<Array<{ id: string; slug: string; name: string }>>;
      };
    }).tenant;

    if (!tenantModel?.findMany) {
      res.json({ tenants: [] });
      return;
    }

    const tenants = await tenantModel.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" }
    });

    res.json({ tenants });
  } catch (error) {
    if (isMissingTableError(error)) {
      res.json({ tenants: [] });
      return;
    }

    res.status(500).json({ error: "Unable to load tenants" });
  }
});
