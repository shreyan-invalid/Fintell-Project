export const typeDefs = `
  enum DataSource {
    ERP
    POS
    MANUAL
    BANK
  }

  input MetricsFilterInput {
    months: Int
    source: DataSource
    from: String
    to: String
  }

  type RevenueTrendPoint {
    period: String!
    revenue: Float!
    expenses: Float!
    netProfit: Float!
  }

  type MetricsTotals {
    revenue: Float!
    expenses: Float!
    netProfit: Float!
  }

  type Metrics {
    trend: [RevenueTrendPoint!]!
    totals: MetricsTotals!
  }

  type SourceBreakdownPoint {
    source: DataSource!
    revenue: Float!
    expenses: Float!
    netProfit: Float!
    records: Int!
  }

  type AnomalyPoint {
    period: String!
    revenue: Float!
    netProfit: Float!
    deviation: Float!
  }

  type Query {
    metrics(filters: MetricsFilterInput): Metrics!
    sourceBreakdown(filters: MetricsFilterInput): [SourceBreakdownPoint!]!
    anomalies(filters: MetricsFilterInput): [AnomalyPoint!]!
  }
`;
