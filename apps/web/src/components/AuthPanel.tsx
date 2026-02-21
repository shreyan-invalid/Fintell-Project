import { Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { clearAuthState, getAuthState, setAuthState } from "../api/authState";

type Props = {
  onApply: () => void;
};

export function AuthPanel({ onApply }: Props) {
  const initial = useMemo(() => getAuthState(), []);
  const [token, setToken] = useState(initial.token);
  const [tenant, setTenant] = useState(initial.tenant);
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("Demo@1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateToken() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        accessToken?: string;
        error?: string;
      };
      if (!response.ok || !payload.accessToken) {
        setError(payload.error ?? "Failed to generate token");
        return;
      }
      setToken(payload.accessToken);
      setAuthState(payload.accessToken, tenant);
      onApply();
    } catch {
      setError("Failed to generate token");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Authentication</Typography>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              size="small"
            />
            <TextField
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              size="small"
              type="password"
            />
            <Button variant="outlined" onClick={() => void generateToken()} disabled={loading}>
              {loading ? "Generating..." : "Generate Token"}
            </Button>
          </Stack>
          <TextField
            label="Bearer Token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Tenant (slug or id)"
            value={tenant}
            onChange={(event) => setTenant(event.target.value)}
            size="small"
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => {
                setError("");
                setAuthState(token, tenant);
                onApply();
              }}
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setError("");
                clearAuthState();
                setToken("");
                setTenant("tenant-1");
                onApply();
              }}
            >
              Clear
            </Button>
          </Stack>
          {error ? <Typography color="error" variant="body2">{error}</Typography> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
