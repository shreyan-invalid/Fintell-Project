export type TenantRole = "OWNER" | "CFO" | "ANALYST" | "VIEWER";

export type TenantContext = {
  tenantId: string;
  role: TenantRole;
};
