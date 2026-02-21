import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCES = ["ERP", "POS", "MANUAL", "BANK"] as const;

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

async function seed(): Promise<void> {
  const tenants = await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.tenant.upsert({
        where: { slug: `tenant-${index + 1}` },
        update: {},
        create: {
          name: `Tenant ${index + 1}`,
          slug: `tenant-${index + 1}`,
          keycloakRealmId: `tenant-${index + 1}`
        }
      })
    )
  );

  const totalRecords = 10000;
  const batchSize = 500;
  const now = new Date();
  const records: Array<{
    tenantId: string;
    periodStart: Date;
    periodEnd: Date;
    revenue: string;
    expenses: string;
    netProfit: string;
    source: (typeof SOURCES)[number];
  }> = [];

  for (let i = 0; i < totalRecords; i += 1) {
    const tenant = tenants[i % tenants.length];
    const monthOffset = i % 24;
    const periodStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
    const revenue = random(30000, 220000);
    const expenses = random(revenue * 0.45, revenue * 0.85);
    const netProfit = revenue - expenses;

    records.push({
      tenantId: tenant.id,
      periodStart,
      periodEnd,
      revenue: toMoney(revenue),
      expenses: toMoney(expenses),
      netProfit: toMoney(netProfit),
      source: SOURCES[i % SOURCES.length]
    });
  }

  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    await prisma.financialRecord.createMany({ data: chunk });
  }

  console.log(`Seeded ${records.length} financial records across ${tenants.length} tenants.`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
