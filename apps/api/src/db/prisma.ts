import { PrismaClient } from "@prisma/client";

type PrismaFallback = {
  $queryRaw: (query: TemplateStringsArray) => Promise<number>;
  financialRecord: {
    findMany: (args?: unknown) => Promise<
      Array<{ periodStart: Date; revenue: number; expenses: number; netProfit: number }>
    >;
  };
  reportArchive: {
    create: (args: unknown) => Promise<unknown>;
  };
  tenant: {
    findFirst: (args: unknown) => Promise<{ id: string; slug: string } | null>;
    upsert: (args: unknown) => Promise<{ id: string; slug: string }>;
  };
};

function createFallbackClient(): PrismaFallback {
  return {
    $queryRaw: async () => 1,
    financialRecord: {
      findMany: async () => []
    },
    reportArchive: {
      create: async (args: unknown) => args
    },
    tenant: {
      findFirst: async () => null,
      upsert: async () => ({ id: "fallback-tenant", slug: "tenant-1" })
    }
  };
}

let client: PrismaClient | PrismaFallback;
try {
  client = new PrismaClient();
} catch {
  client = createFallbackClient();
}

export const prisma = client;
