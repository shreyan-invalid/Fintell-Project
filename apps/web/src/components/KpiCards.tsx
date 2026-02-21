import { Card, CardContent, Grid2 as Grid, Typography } from "@mui/material";

type Props = {
  totals?: {
    revenue: number;
    expenses: number;
    netProfit: number;
  };
};

export function KpiCards({ totals }: Props) {
  const values = totals ?? { revenue: 0, expenses: 0, netProfit: 0 };
  const cards = [
    { title: "Revenue", value: values.revenue },
    { title: "Expenses", value: values.expenses },
    { title: "Net Profit", value: values.netProfit }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, md: 4 }} key={card.title}>
          <Card>
            <CardContent>
              <Typography variant="overline">{card.title}</Typography>
              <Typography variant="h5">${card.value.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
