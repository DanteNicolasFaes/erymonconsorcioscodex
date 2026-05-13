"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function requireActiveTenantId() {
  const state = await getCurrentUser();

  if (state.roleKind !== "tenant_admin" || !state.tenantMembership) {
    redirect("/access-unavailable");
  }

  return state.tenantMembership.tenant_id;
}

export async function createBuilding(formData: FormData) {
  await requireActiveTenantId();
  const name = value(formData, "name");
  const address = value(formData, "address") || null;
  const cuit = value(formData, "cuit") || null;

  if (!name) {
    redirectWithError("/buildings/new", "El nombre del edificio es obligatorio.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_building", {
    p_name: name,
    p_address: address,
    p_cuit: cuit
  });

  if (error) {
    redirectWithError("/buildings/new", error.message);
  }

  if (!data?.id) {
    redirectWithError("/buildings/new", "No se pudo crear el edificio.");
  }

  revalidatePath("/buildings");
  redirect(`/buildings/${data.id}`);
}

export async function updateBuilding(formData: FormData) {
  await requireActiveTenantId();
  const buildingId = value(formData, "building_id");
  const name = value(formData, "name");
  const address = value(formData, "address") || null;
  const cuit = value(formData, "cuit") || null;

  if (!buildingId) {
    redirectWithError("/buildings", "Falta identificar el edificio.");
  }

  if (!name) {
    redirectWithError(
      `/buildings/${buildingId}/edit`,
      "El nombre del edificio es obligatorio."
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_building", {
    p_building_id: buildingId,
    p_name: name,
    p_address: address,
    p_cuit: cuit
  });

  if (error) {
    redirectWithError(`/buildings/${buildingId}/edit`, error.message);
  }

  revalidatePath("/buildings");
  revalidatePath(`/buildings/${buildingId}`);
  redirect(`/buildings/${buildingId}`);
}

export async function archiveBuilding(formData: FormData) {
  await requireActiveTenantId();
  const buildingId = value(formData, "building_id");

  if (!buildingId) {
    redirectWithError("/buildings", "Falta identificar el edificio.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_building", {
    p_building_id: buildingId
  });

  if (error) {
    redirectWithError(`/buildings/${buildingId}`, error.message);
  }

  revalidatePath("/buildings");
  revalidatePath(`/buildings/${buildingId}`);
  redirect(`/buildings/${buildingId}`);
}

export async function unarchiveBuilding(formData: FormData) {
  await requireActiveTenantId();
  const buildingId = value(formData, "building_id");

  if (!buildingId) {
    redirectWithError("/buildings", "Falta identificar el edificio.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("unarchive_building", {
    p_building_id: buildingId
  });

  if (error) {
    redirectWithError(`/buildings/${buildingId}`, error.message);
  }

  revalidatePath("/buildings");
  revalidatePath(`/buildings/${buildingId}`);
  redirect(`/buildings/${buildingId}`);
}
