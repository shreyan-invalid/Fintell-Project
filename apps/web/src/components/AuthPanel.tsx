import { Alert, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAuthState, setAuthState } from "../api/authState";
import { fetchTenants, type TenantOption } from "../api/tenants";

type Props = {
  onApply: () => Promise<unknown>;
};

export function AuthPanel({ onApply }: Props) {
  const initial = useMemo(() => getAuthState(), []);
  const [tenant, setTenant] = useState(initial.tenant);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [switchingTenant, setSwitchingTenant] = useState(false);
  const [error, setError] = useState("");

  const switchTenant = useCallback(
    async (nextTenant: string) => {
      const { token, idToken, refreshToken } = getAuthState();
      setSwitchingTenant(true);
      setError("");

      try {
        setAuthState(token, nextTenant, idToken, refreshToken);
        await onApply();
      } catch {
        setError("Failed to load selected tenant data");
      } finally {
        setSwitchingTenant(false);
      }
    },
    [onApply]
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoadingTenants(true);
      setError("");

      try {
        const options = await fetchTenants();
        if (!active) return;

        setTenants(options);

        const hasCurrent = options.some((item) => item.slug === tenant || item.id === tenant);
        if (!hasCurrent && options[0]) {
          const nextTenant = options[0].slug;
          setTenant(nextTenant);
          await switchTenant(nextTenant);
        }
      } catch {
        if (!active) return;
        setError("Unable to load tenants");
      } finally {
        if (active) setLoadingTenants(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [switchTenant, tenant]);

  async function handleTenantChange(event: SelectChangeEvent<string>): Promise<void> {
    const nextTenant = event.target.value;
    setTenant(nextTenant);
    await switchTenant(nextTenant);
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Tenant View</Typography>
        <Stack spacing={1.5}>
          <FormControl size="small" fullWidth>
            <InputLabel id="tenant-select-label">Tenant</InputLabel>
            <Select
              labelId="tenant-select-label"
              label="Tenant"
              value={tenant}
              onChange={(event) => {
                void handleTenantChange(event);
              }}
              disabled={loadingTenants || switchingTenant}
            >
              {tenants.length === 0 ? (
                <MenuItem value={tenant || "tenant-1"}>{tenant || "tenant-1"}</MenuItem>
              ) : (
                tenants.map((item) => (
                  <MenuItem key={item.id} value={item.slug}>
                    {item.name} ({item.slug})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {loadingTenants ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">Loading tenants...</Typography>
            </Stack>
          ) : null}

          {switchingTenant ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">Switching tenant and loading data...</Typography>
            </Stack>
          ) : null}

          {error ? <Alert severity="warning">{error}</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
