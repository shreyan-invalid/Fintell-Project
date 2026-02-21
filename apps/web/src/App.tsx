import { Alert, Box, CircularProgress, Container, CssBaseline, Grid2 as Grid, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { AxiosError } from "axios";
import { AuthPanel } from "./components/AuthPanel";
import { FinancialGrid } from "./components/FinancialGrid";
import { KpiCards } from "./components/KpiCards";
import { RevenueChart } from "./components/RevenueChart";
import { useMetrics } from "./hooks/useMetrics";
import { theme } from "./theme/theme";

export default function App() {
  const { data, isLoading, isError, error, refetch } = useMetrics();
  const message = isError
    ? ((error as AxiosError<{ error?: string }>)?.response?.data?.error ?? "Failed to fetch metrics")
    : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", py: 4, background: "linear-gradient(180deg, #f8fbfc 0%, #eef4f6 100%)" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            FinIntel Dashboard
          </Typography>

          <AuthPanel onApply={() => void refetch()} />

          {message ? <Alert severity="warning" sx={{ mb: 2 }}>{message}</Alert> : null}

          {isLoading ? (
            <CircularProgress />
          ) : (
            <>
              <KpiCards totals={data?.totals} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <RevenueChart data={data?.trend ?? []} />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <FinancialGrid rows={data?.trend ?? []} />
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
