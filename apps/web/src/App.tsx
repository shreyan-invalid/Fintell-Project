import { Alert, Box, Button, CircularProgress, Container, CssBaseline, Grid2 as Grid, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { getAuthState } from "./api/authState";
import { beginOidcLogin, completeOidcCallback, logoutOidc } from "./api/oidc";
import { AuthPanel } from "./components/AuthPanel";
import { FinancialGrid } from "./components/FinancialGrid";
import { KpiCards } from "./components/KpiCards";
import { RevenueChart } from "./components/RevenueChart";
import { useMetrics } from "./hooks/useMetrics";
import { theme } from "./theme/theme";

type LocalAuth = {
  token: string;
  idToken: string;
};

export default function App() {
  const isCallbackPath = window.location.pathname === "/oidc/callback";
  const [oidcError, setOidcError] = useState("");
  const [auth, setAuth] = useState<LocalAuth>(() => {
    const state = getAuthState();
    return { token: state.token, idToken: state.idToken };
  });

  const isAuthenticated = useMemo(() => Boolean(auth.token && auth.idToken), [auth]);

  const { data, isLoading, isError, error, refetch } = useMetrics({
    enabled: isAuthenticated && !isCallbackPath
  });

  useEffect(() => {
    if (!isCallbackPath) {
      return;
    }

    void (async () => {
      try {
        await completeOidcCallback();
        const state = getAuthState();
        setAuth({ token: state.token, idToken: state.idToken });
        await refetch();
      } catch (err) {
        setOidcError(err instanceof Error ? err.message : "OIDC login failed");
      }
    })();
  }, [isCallbackPath, refetch]);

  if (!isAuthenticated && !isCallbackPath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg, #f8fbfc 0%, #eef4f6 100%)" }}>
          <Container maxWidth="sm" sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
              FinIntel Login
            </Typography>
            <Typography sx={{ mb: 3, color: "text.secondary" }}>
              Sign in with Keycloak to continue to the dashboard.
            </Typography>
            <Button variant="contained" size="large" onClick={() => void beginOidcLogin()}>
              Continue to Keycloak
            </Button>
            {oidcError ? <Alert severity="error" sx={{ mt: 2 }}>{oidcError}</Alert> : null}
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  if (isCallbackPath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  const message = oidcError || (isError
    ? ((error as AxiosError<{ error?: string }>)?.response?.data?.error ?? "Failed to fetch metrics")
    : null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", py: 4, background: "linear-gradient(180deg, #f8fbfc 0%, #eef4f6 100%)" }}>
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            FinIntel Dashboard
          </Typography>

          <Button
            variant="outlined"
            sx={{ mb: 2 }}
            onClick={() => {
              logoutOidc();
              setAuth({ token: "", idToken: "" });
            }}
          >
            Logout
          </Button>

          <AuthPanel onApply={async () => { await refetch(); }} />

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
