import { jest } from "@jest/globals";
import { prisma } from "../src/db/prisma.js";
import {
  getAnomalies,
  getMetrics,
  getSourceBreakdown,
  type DataSource
} from "../src/services/metrics.js";

type Row = {
  periodStart: Date;
  revenue: number;
  expenses: number;
  netProfit: number;
  source: DataSource;
};

describe("metrics service", () => {
  const originalFindMany = prisma.financialRecord.findMany;

  afterEach(() => {
    (prisma.financialRecord as unknown as { findMany: typeof originalFindMany }).findMany = originalFindMany;
  });

  it("passes tenant-aware filters to prisma and returns metrics", async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { periodStart: new Date("2025-01-01"), revenue: 100, expenses: 40, netProfit: 60, source: "ERP" },
      { periodStart: new Date("2025-01-15"), revenue: 200, expenses: 50, netProfit: 150, source: "ERP" }
    ] satisfies Row[]);

    (prisma.financialRecord as unknown as { findMany: typeof mockFindMany }).findMany = mockFindMany;

    const result = await getMetrics("tenant-1", { months: 6, source: "ERP" });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const call = mockFindMany.mock.calls[0]?.[0] as { where: { tenantId: string; source?: string } };
    expect(call.where.tenantId).toBe("tenant-1");
    expect(call.where.source).toBe("ERP");
    expect(result.totals).toEqual({ revenue: 300, expenses: 90, netProfit: 210 });
  });

  it("returns source breakdown", async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { periodStart: new Date("2025-01-01"), revenue: 300, expenses: 180, netProfit: 120, source: "POS" },
      { periodStart: new Date("2025-02-01"), revenue: 150, expenses: 90, netProfit: 60, source: "ERP" }
    ] satisfies Row[]);

    (prisma.financialRecord as unknown as { findMany: typeof mockFindMany }).findMany = mockFindMany;

    const result = await getSourceBreakdown("tenant-1", {});
    expect(result[0]?.source).toBe("POS");
    expect(result).toHaveLength(2);
  });

  it("returns anomaly list from trend", async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { periodStart: new Date("2025-01-01"), revenue: 100, expenses: 50, netProfit: 50, source: "ERP" },
      { periodStart: new Date("2025-02-01"), revenue: 110, expenses: 55, netProfit: 55, source: "ERP" },
      { periodStart: new Date("2025-03-01"), revenue: 500, expenses: 120, netProfit: 380, source: "ERP" },
      { periodStart: new Date("2025-04-01"), revenue: 90, expenses: 45, netProfit: 45, source: "ERP" }
    ] satisfies Row[]);

    (prisma.financialRecord as unknown as { findMany: typeof mockFindMany }).findMany = mockFindMany;

    const result = await getAnomalies("tenant-1", {});
    expect(result).toHaveLength(1);
    expect(result[0]?.period).toBe("2025-03");
  });
});
