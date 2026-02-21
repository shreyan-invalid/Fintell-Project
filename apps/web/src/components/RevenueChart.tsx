import { Card, CardContent, Typography } from "@mui/material";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenueTrendPoint } from "../api/metrics";

type Props = {
  data: RevenueTrendPoint[];
};

export function RevenueChart({ data }: Props) {
  return (
    <Card sx={{ height: 340 }}>
      <CardContent sx={{ height: "100%" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Revenue Trend</Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#005f73" strokeWidth={2} />
            <Line type="monotone" dataKey="netProfit" stroke="#bb3e03" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
