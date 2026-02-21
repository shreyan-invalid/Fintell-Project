import { api } from "./client";

export type RevenueTrendPoint = {
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
};

export type MetricsResponse = {
  trend: RevenueTrendPoint[];
  totals: {
    revenue: number;
    expenses: number;
    netProfit: number;
  };
};

export async function fetchMetrics(): Promise<MetricsResponse> {
  const { data } = await api.get<MetricsResponse>("/v1/financial/metrics");
  return data;
}
