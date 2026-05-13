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

function prefixIfMissing(value: string, prefix: string) {
  return value.toLowerCase().startsWith(prefix.toLowerCase())
    ? value
    : `${prefix} ${value}`;
}

function buildIdentifier(
  type: string,
  floor: string | null,
  unitNumber: string | null
) {
  if (type === "departamento") {
    return floor && unitNumber ? `${floor}-${unitNumber}` : null;
  }

  if (type === "cochera") {
    return unitNumber ? prefixIfMissing(unitNumber, "Cochera") : null;
  }

  if (type === "baulera") {
    return unitNumber ? prefixIfMissing(unitNumber, "Baulera") : null;
  }

  if (type === "local") {
    return unitNumber ? prefixIfMissing(unitNumber, "Local") : null;
  }

  if (type === "encargado") {
    return floor && unitNumber
      ? `Vivienda encargado ${floor}-${unitNumber}`
      : "Vivienda encargado";
  }

  return null;
}

async function requireTenantAdminSession() {
  const state = await getCurrentUser();

  if (state.roleKind !== "tenant_admin" || !state.tenantMembership) {
    redirect("/access-unavailable");
  }

  return state;
}

export async function createFunctionalUnit(formData: FormData) {
  await requireTenantAdminSession();
  const buildingId = value(formData, "building_id");
  const type = value(formData, "type");
  const floor = value(formData, "floor") || null;
  const unitNumber = value(formData, "unit_number") || null;
  const identifier = buildIdentifier(type, floor, unitNumber);
  const occupancyStatus = value(formData, "occupancy_status") || "sin_datos";

  if (!buildingId) {
    redirectWithError("/buildings", "Falta identificar el edificio.");
  }

  if (!type || !identifier) {
    redirectWithError(
      `/buildings/${buildingId}/units/new`,
      "Completa los datos requeridos para la unidad funcional."
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_functional_unit", {
    p_building_id: buildingId,
    p_type: type,
    p_identifier: identifier,
    p_floor: floor,
    p_unit_number: unitNumber,
    p_occupancy_status: occupancyStatus
  });

  if (error) {
    redirectWithError(`/buildings/${buildingId}/units/new`, error.message);
  }

  if (!data?.id) {
    redirectWithError(
      `/buildings/${buildingId}/units/new`,
      "No se pudo crear la unidad funcional."
    );
  }

  revalidatePath(`/buildings/${buildingId}/units`);
  redirect(`/buildings/${buildingId}/units/new?created=1`);
}

export async function updateFunctionalUnit(formData: FormData) {
  await requireTenantAdminSession();
  const buildingId = value(formData, "building_id");
  const unitId = value(formData, "functional_unit_id");
  const type = value(formData, "type");
  const floor = value(formData, "floor") || null;
  const unitNumber = value(formData, "unit_number") || null;
  const identifier = buildIdentifier(type, floor, unitNumber);
  const occupancyStatus = value(formData, "occupancy_status") || "sin_datos";

  if (!buildingId || !unitId) {
    redirectWithError("/buildings", "Falta identificar la unidad funcional.");
  }

  if (!type || !identifier) {
    redirectWithError(
      `/buildings/${buildingId}/units/${unitId}/edit`,
      "Completa los datos requeridos para la unidad funcional."
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_functional_unit", {
    p_functional_unit_id: unitId,
    p_type: type,
    p_identifier: identifier,
    p_floor: floor,
    p_unit_number: unitNumber,
    p_occupancy_status: occupancyStatus
  });

  if (error) {
    redirectWithError(
      `/buildings/${buildingId}/units/${unitId}/edit`,
      error.message
    );
  }

  revalidatePath(`/buildings/${buildingId}/units`);
  revalidatePath(`/buildings/${buildingId}/units/${unitId}`);
  redirect(`/buildings/${buildingId}/units/${unitId}`);
}

export async function archiveFunctionalUnit(formData: FormData) {
  await requireTenantAdminSession();
  const buildingId = value(formData, "building_id");
  const unitId = value(formData, "functional_unit_id");

  if (!buildingId || !unitId) {
    redirectWithError("/buildings", "Falta identificar la unidad funcional.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_functional_unit", {
    p_functional_unit_id: unitId
  });

  if (error) {
    redirectWithError(`/buildings/${buildingId}/units/${unitId}`, error.message);
  }

  revalidatePath(`/buildings/${buildingId}/units`);
  revalidatePath(`/buildings/${buildingId}/units/${unitId}`);
  redirect(`/buildings/${buildingId}/units/${unitId}`);
}

export async function unarchiveFunctionalUnit(formData: FormData) {
  await requireTenantAdminSession();
  const buildingId = value(formData, "building_id");
  const unitId = value(formData, "functional_unit_id");

  if (!buildingId || !unitId) {
    redirectWithError("/buildings", "Falta identificar la unidad funcional.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("unarchive_functional_unit", {
    p_functional_unit_id: unitId
  });

  if (error) {
    redirectWithError(`/buildings/${buildingId}/units/${unitId}`, error.message);
  }

  revalidatePath(`/buildings/${buildingId}/units`);
  revalidatePath(`/buildings/${buildingId}/units/${unitId}`);
  redirect(`/buildings/${buildingId}/units/${unitId}`);
}
