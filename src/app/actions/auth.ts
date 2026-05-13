"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");

  if (!email || !password) {
    redirectWithError("/login", "Ingresá email y contraseña.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectWithError("/login", error.message);
  }

  if (!data.user) {
    redirectWithError("/login", "No se pudo resolver el usuario autenticado.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,global_role,status")
    .eq("id", data.user.id)
    .maybeSingle<{
      id: string;
      email: string;
      full_name: string | null;
      global_role: "superadmin" | null;
      status: "pending" | "active" | "rejected" | "disabled";
    }>();

  if (profileError) {
    redirectWithError("/login", profileError.message);
  }

  if (!profile) {
    redirect("/register");
  }

  if (profile.status === "pending") {
    redirect("/pending-approval");
  }

  if (profile.status === "rejected") {
    redirect("/request-rejected");
  }

  if (profile.status === "disabled") {
    redirect("/account-disabled");
  }

  if (profile.global_role === "superadmin") {
    redirect("/superadmin/requests");
  }

  const { data: tenantMembership, error: membershipError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", data.user.id)
    .eq("role", "tenant_admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle<{ tenant_id: string }>();

  if (membershipError) {
    redirectWithError("/login", membershipError.message);
  }

  if (tenantMembership) {
    redirect("/buildings");
  }

  redirect("/access-unavailable");
}

export async function registerAdmin(formData: FormData) {
  const fullName = value(formData, "full_name");
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const phone = value(formData, "phone") || null;
  const companyName = value(formData, "company_name");
  const cuit = value(formData, "cuit") || null;

  if (!fullName || !email || !password || !companyName) {
    redirectWithError(
      "/register",
      "Completá nombre, email, contraseña y administradora."
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    redirectWithError("/register", error.message);
  }

  if (!data.session || !data.user) {
    redirectWithError(
      "/register",
      "El usuario fue creado, pero Supabase requiere confirmación de email antes de crear la solicitud. Confirmá el email o desactivá email confirmation en dev/staging."
    );
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    email,
    full_name: fullName,
    global_role: null,
    status: "pending"
  });

  if (profileError) {
    redirectWithError("/register", profileError.message);
  }

  const { error: requestError } = await supabase.from("admin_requests").insert({
    user_id: data.user.id,
    full_name: fullName,
    email,
    phone,
    company_name: companyName,
    cuit,
    status: "pending"
  });

  if (requestError) {
    redirectWithError("/register", requestError.message);
  }

  redirect("/pending-approval");
}

export async function forgotPassword(formData: FormData) {
  const email = value(formData, "email").toLowerCase();

  if (!email) {
    redirectWithError("/forgot-password", "Ingresá tu email.");
  }

  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`
  });

  if (error) {
    redirectWithError("/forgot-password", error.message);
  }

  redirect(
    `/forgot-password?message=${encodeURIComponent(
      "Si el email existe, Supabase enviará instrucciones para recuperar la contraseña."
    )}`
  );
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
