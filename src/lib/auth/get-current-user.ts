import { createClient } from "@/lib/supabase/server";

export type ProfileStatus = "pending" | "active" | "rejected" | "disabled";
export type GlobalRole = "superadmin" | null;
export type TenantRole = "tenant_admin";

export type CurrentProfile = {
  id: string;
  email: string;
  full_name: string | null;
  global_role: GlobalRole;
  status: ProfileStatus;
};

export type CurrentTenantMembership = {
  tenant_id: string;
  role: TenantRole;
  status: "active" | "disabled";
};

export type CurrentUserState = {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: CurrentProfile | null;
  tenantMembership: CurrentTenantMembership | null;
  roleKind: "anonymous" | "superadmin" | "tenant_admin" | "unassigned";
  status: ProfileStatus | "missing_profile" | "anonymous";
};

export async function getCurrentUser(): Promise<CurrentUserState> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      tenantMembership: null,
      roleKind: "anonymous",
      status: "anonymous"
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,global_role,status")
    .eq("id", user.id)
    .maybeSingle<CurrentProfile>();

  if (profileError) {
    throw new Error(`Unable to read current profile: ${profileError.message}`);
  }

  if (!profile) {
    return {
      user: {
        id: user.id,
        email: user.email
      },
      profile: null,
      tenantMembership: null,
      roleKind: "unassigned",
      status: "missing_profile"
    };
  }

  if (profile.status !== "active") {
    return {
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      tenantMembership: null,
      roleKind: "unassigned",
      status: profile.status
    };
  }

  if (profile.global_role === "superadmin") {
    return {
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      tenantMembership: null,
      roleKind: "superadmin",
      status: "active"
    };
  }

  const { data: tenantMembership, error: tenantMembershipError } = await supabase
    .from("tenant_members")
    .select("tenant_id,role,status")
    .eq("user_id", user.id)
    .eq("role", "tenant_admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle<CurrentTenantMembership>();

  if (tenantMembershipError) {
    throw new Error(
      `Unable to read current tenant membership: ${tenantMembershipError.message}`
    );
  }

  return {
    user: {
      id: user.id,
      email: user.email
    },
    profile,
    tenantMembership: tenantMembership ?? null,
    roleKind: tenantMembership ? "tenant_admin" : "unassigned",
    status: "active"
  };
}
