import { Router } from "express";
import { z } from "zod";
import {
  getAnomalies,
  getMetrics,
  getSourceBreakdown,
  type DataSource,
  type MetricsFilters
} from "../services/metrics.js";

export const financialRouter = Router();

const querySchema = z.object({
  months: z.coerce.number().int().min(1).max(36).optional(),
  source: z.enum(["ERP", "POS", "MANUAL", "BANK"]).optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

export function parseFilters(query: unknown): MetricsFilters {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return {};
  }

  const output = parsed.data;
  return {
    months: output.months,
    source: output.source as DataSource | undefined,
    from: output.from,
    to: output.to
  };
}

financialRouter.get("/metrics", async (req, res) => {
  if (!res.locals.tenantId) {
    res.json({ trend: [], totals: { revenue: 0, expenses: 0, netProfit: 0 } });
    return;
  }
  const tenantId = res.locals.tenantId as string;
  const data = await getMetrics(tenantId, parseFilters(req.query));
  res.json(data);
});

financialRouter.get("/metrics/sources", async (req, res) => {
  if (!res.locals.tenantId) { res.json({ sources: [] }); return; }
  const tenantId = res.locals.tenantId as string;
  const sources = await getSourceBreakdown(tenantId, parseFilters(req.query));
  res.json({ sources });
});

financialRouter.get("/metrics/anomalies", async (req, res) => {
  if (!res.locals.tenantId) { res.json({ anomalies: [] }); return; }

  const tenantId = res.locals.tenantId as string;
  const anomalies = await getAnomalies(tenantId, parseFilters(req.query));
  res.json({ anomalies });
});
