import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getActiveTenantId() {
  const state = await getCurrentUser();

  if (state.roleKind !== "tenant_admin" || !state.tenantMembership) {
    return null;
  }

  return state.tenantMembership.tenant_id;
}
