"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/superadmin/requests?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(message: string): never {
  redirect(`/superadmin/requests?message=${encodeURIComponent(message)}`);
}

export async function approveAdminRequest(formData: FormData) {
  const adminRequestId = value(formData, "admin_request_id");
  const tenantName = value(formData, "tenant_name");
  const tenantLegalName = value(formData, "tenant_legal_name");
  const tenantCuit = value(formData, "tenant_cuit");

  if (!adminRequestId) {
    redirectWithError("Falta identificar la solicitud.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_admin_request", {
    p_admin_request_id: adminRequestId,
    p_tenant_name: tenantName || null,
    p_tenant_legal_name: tenantLegalName || null,
    p_tenant_cuit: tenantCuit || null
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/superadmin/requests");
  revalidatePath("/superadmin/logs");
  redirectWithMessage("Solicitud aprobada correctamente.");
}

export async function rejectAdminRequest(formData: FormData) {
  const adminRequestId = value(formData, "admin_request_id");
  const rejectionReason = value(formData, "rejection_reason");

  if (!adminRequestId) {
    redirectWithError("Falta identificar la solicitud.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_admin_request", {
    p_admin_request_id: adminRequestId,
    p_rejection_reason: rejectionReason || null
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/superadmin/requests");
  revalidatePath("/superadmin/logs");
  redirectWithMessage("Solicitud rechazada correctamente.");
}
