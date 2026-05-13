import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export function destinationForCurrentUser(
  state: Awaited<ReturnType<typeof getCurrentUser>>
) {
  if (state.status === "anonymous") {
    return "/login";
  }

  if (state.status === "missing_profile") {
    return "/register";
  }

  if (state.status === "pending") {
    return "/pending-approval";
  }

  if (state.status === "rejected") {
    return "/request-rejected";
  }

  if (state.status === "disabled") {
    return "/account-disabled";
  }

  if (state.roleKind === "superadmin") {
    return "/superadmin/requests";
  }

  if (state.roleKind === "tenant_admin") {
    return "/buildings";
  }

  return "/access-unavailable";
}

export async function requireSuperadmin() {
  const state = await getCurrentUser();

  if (state.roleKind !== "superadmin") {
    redirect(destinationForCurrentUser(state));
  }

  return state;
}

export async function requireTenantAdmin() {
  const state = await getCurrentUser();

  if (state.roleKind !== "tenant_admin") {
    redirect(destinationForCurrentUser(state));
  }

  return state;
}
