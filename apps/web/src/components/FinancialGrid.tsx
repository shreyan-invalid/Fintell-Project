import { Card, CardContent, Typography } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import type { RevenueTrendPoint } from "../api/metrics";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

type Props = {
  rows: RevenueTrendPoint[];
};

const columnDefs: ColDef<RevenueTrendPoint>[] = [
  { field: "period", headerName: "Period", filter: true },
  { field: "revenue", headerName: "Revenue", valueFormatter: (p) => `$${Number(p.value).toLocaleString()}` },
  { field: "expenses", headerName: "Expenses", valueFormatter: (p) => `$${Number(p.value).toLocaleString()}` },
  { field: "netProfit", headerName: "Net Profit", valueFormatter: (p) => `$${Number(p.value).toLocaleString()}` }
];

export function FinancialGrid({ rows }: Props) {
  return (
    <Card sx={{ height: 420 }}>
      <CardContent sx={{ height: "100%" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Financial Records</Typography>
        <div className="ag-theme-quartz" style={{ height: "90%" }}>
          <AgGridReact rowData={rows} columnDefs={columnDefs} animateRows pagination />
        </div>
      </CardContent>
    </Card>
  );
}
