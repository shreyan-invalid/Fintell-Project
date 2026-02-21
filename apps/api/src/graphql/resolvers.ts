import {
  getAnomalies,
  getMetrics,
  getSourceBreakdown,
  type MetricsFilters
} from "../services/metrics.js";

type GraphContext = {
  tenantId: string;
};

type GraphArgs = {
  filters?: MetricsFilters;
};

export const resolvers = {
  Query: {
    metrics: async (_: unknown, args: GraphArgs, context: GraphContext) => {
      const data = await getMetrics(context.tenantId, args.filters ?? {});
      return {
        trend: data.trend,
        totals: data.totals
      };
    },
    sourceBreakdown: async (_: unknown, args: GraphArgs, context: GraphContext) => {
      return getSourceBreakdown(context.tenantId, args.filters ?? {});
    },
    anomalies: async (_: unknown, args: GraphArgs, context: GraphContext) => {
      return getAnomalies(context.tenantId, args.filters ?? {});
    }
  }
};
