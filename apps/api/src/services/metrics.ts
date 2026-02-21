import { prisma } from "../db/prisma.js";

export type DataSource = "ERP" | "POS" | "MANUAL" | "BANK";

export type RevenueTrendPoint = {
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
};

export type SourceBreakdownPoint = {
  source: DataSource;
  revenue: number;
  expenses: number;
  netProfit: number;
  records: number;
};

export type AnomalyPoint = {
  period: string;
  revenue: number;
  netProfit: number;
  deviation: number;
};

export type MetricsFilters = {
  months?: number;
  source?: DataSource;
  from?: string;
  to?: string;
};

type FinancialRow = {
  periodStart: Date;
  revenue: unknown;
  expenses: unknown;
  netProfit: unknown;
  source: DataSource;
};

function toNumber(value: unknown): number {
  return Number(value);
}

function toMonth(periodStart: Date): string {
  return periodStart.toISOString().slice(0, 7);
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function buildWhere(tenantId: string, filters: MetricsFilters) {
  const now = new Date();
  const autoFrom = filters.months ? new Date(now.getFullYear(), now.getMonth() - (filters.months - 1), 1) : undefined;
  const from = parseDate(filters.from) ?? autoFrom;
  const to = parseDate(filters.to);

  const where: {
    tenantId: string;
    source?: DataSource;
    periodStart?: { gte?: Date; lte?: Date };
  } = { tenantId };

  if (filters.source) {
    where.source = filters.source;
  }

  if (from || to) {
    where.periodStart = {};
    if (from) where.periodStart.gte = from;
    if (to) where.periodStart.lte = to;
  }

  return where;
}

export function aggregateTrend(rows: FinancialRow[]): RevenueTrendPoint[] {
  const bucket = new Map<string, RevenueTrendPoint>();

  for (const row of rows) {
    const period = toMonth(row.periodStart);
    const current = bucket.get(period) ?? { period, revenue: 0, expenses: 0, netProfit: 0 };
    current.revenue += toNumber(row.revenue);
    current.expenses += toNumber(row.expenses);
    current.netProfit += toNumber(row.netProfit);
    bucket.set(period, current);
  }

  return [...bucket.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export function aggregateTotals(trend: RevenueTrendPoint[]) {
  return trend.reduce(
    (acc, point) => {
      acc.revenue += point.revenue;
      acc.expenses += point.expenses;
      acc.netProfit += point.netProfit;
      return acc;
    },
    { revenue: 0, expenses: 0, netProfit: 0 }
  );
}

export function aggregateSources(rows: FinancialRow[]): SourceBreakdownPoint[] {
  const bucket = new Map<DataSource, SourceBreakdownPoint>();

  for (const row of rows) {
    const source = row.source;
    const current = bucket.get(source) ?? { source, revenue: 0, expenses: 0, netProfit: 0, records: 0 };
    current.revenue += toNumber(row.revenue);
    current.expenses += toNumber(row.expenses);
    current.netProfit += toNumber(row.netProfit);
    current.records += 1;
    bucket.set(source, current);
  }

  return [...bucket.values()].sort((a, b) => b.revenue - a.revenue);
}

export function detectRevenueAnomalies(trend: RevenueTrendPoint[]): AnomalyPoint[] {
  if (trend.length < 3) return [];

  const average = trend.reduce((acc, point) => acc + point.revenue, 0) / trend.length;
  const variance = trend.reduce((acc, point) => acc + (point.revenue - average) ** 2, 0) / trend.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return [];

  return trend
    .map((point) => {
      const zScore = (point.revenue - average) / stdDev;
      return {
        period: point.period,
        revenue: point.revenue,
        netProfit: point.netProfit,
        deviation: Number(zScore.toFixed(2))
      };
    })
    .filter((point) => Math.abs(point.deviation) >= 1.5)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}

export async function getMetrics(tenantId: string, filters: MetricsFilters) {
  const rows = (await prisma.financialRecord.findMany({
    where: buildWhere(tenantId, filters),
    orderBy: { periodStart: "asc" },
    take: filters.months ? undefined : 500
  })) as FinancialRow[];

  const trend = aggregateTrend(rows);
  const totals = aggregateTotals(trend);

  return { trend, totals };
}

export async function getSourceBreakdown(tenantId: string, filters: MetricsFilters) {
  const rows = (await prisma.financialRecord.findMany({
    where: buildWhere(tenantId, filters),
    orderBy: { periodStart: "asc" },
    take: 1000
  })) as FinancialRow[];

  return aggregateSources(rows);
}

export async function getAnomalies(tenantId: string, filters: MetricsFilters) {
  const { trend } = await getMetrics(tenantId, filters);
  return detectRevenueAnomalies(trend);
}
