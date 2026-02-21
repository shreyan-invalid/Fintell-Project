import {
  aggregateSources,
  aggregateTotals,
  aggregateTrend,
  detectRevenueAnomalies
} from "../src/services/metrics.js";

describe("metrics aggregation", () => {
  const rows = [
    { periodStart: new Date("2025-01-01"), revenue: 100, expenses: 40, netProfit: 60, source: "ERP" as const },
    { periodStart: new Date("2025-01-15"), revenue: 200, expenses: 50, netProfit: 150, source: "POS" as const },
    { periodStart: new Date("2025-02-01"), revenue: 150, expenses: 60, netProfit: 90, source: "ERP" as const }
  ];

  it("aggregates monthly trend and totals", () => {
    const trend = aggregateTrend(rows);
    const totals = aggregateTotals(trend);

    expect(trend).toEqual([
      { period: "2025-01", revenue: 300, expenses: 90, netProfit: 210 },
      { period: "2025-02", revenue: 150, expenses: 60, netProfit: 90 }
    ]);
    expect(totals).toEqual({ revenue: 450, expenses: 150, netProfit: 300 });
  });

  it("aggregates by source", () => {
    const sources = aggregateSources(rows);

    expect(sources).toEqual([
      { source: "ERP", revenue: 250, expenses: 100, netProfit: 150, records: 2 },
      { source: "POS", revenue: 200, expenses: 50, netProfit: 150, records: 1 }
    ]);
  });

  it("detects revenue anomalies by z-score", () => {
    const anomalies = detectRevenueAnomalies([
      { period: "2025-01", revenue: 100, expenses: 50, netProfit: 50 },
      { period: "2025-02", revenue: 110, expenses: 52, netProfit: 58 },
      { period: "2025-03", revenue: 520, expenses: 100, netProfit: 420 },
      { period: "2025-04", revenue: 90, expenses: 45, netProfit: 45 }
    ]);

    expect(anomalies.length).toBe(1);
    expect(anomalies[0]?.period).toBe("2025-03");
  });
});
