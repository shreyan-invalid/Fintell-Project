import { api } from "./client";

export type TenantOption = {
  id: string;
  slug: string;
  name: string;
};

type TenantsResponse = {
  tenants: TenantOption[];
};

export async function fetchTenants(): Promise<TenantOption[]> {
  const { data } = await api.get<TenantsResponse>("/tenants");
  return data.tenants ?? [];
}
