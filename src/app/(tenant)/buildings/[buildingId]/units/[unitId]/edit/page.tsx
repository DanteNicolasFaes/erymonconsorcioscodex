import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateFunctionalUnit } from "@/app/actions/functional-units";
import { FunctionalUnitForm } from "@/components/functional-units/functional-unit-form";
import { Alert, Card, PageHeader, PageShell } from "@/components/ui";

export const dynamic = "force-dynamic";

type EditUnitPageProps = {
  params: Promise<{
    buildingId: string;
    unitId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type Building = {
  id: string;
  name: string;
};

type FunctionalUnit = {
  id: string;
  type: string;
  identifier: string;
  floor: string | null;
  unit_number: string | null;
  occupancy_status: string;
  status: "active" | "archived";
};

export default async function EditUnitPage({
  params,
  searchParams
}: EditUnitPageProps) {
  const state = await requireTenantAdmin();
  const { buildingId, unitId } = await params;
  const query = await searchParams;
  const tenantId = state.tenantMembership?.tenant_id;

  if (!tenantId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .select("id,name")
    .eq("id", buildingId)
    .eq("tenant_id", tenantId)
    .maybeSingle<Building>();

  if (buildingError) {
    throw new Error(`No se pudo cargar el edificio: ${buildingError.message}`);
  }

  if (!building) {
    notFound();
  }

  const { data: unit, error } = await supabase
    .from("functional_units")
    .select("id,type,identifier,floor,unit_number,occupancy_status,status")
    .eq("id", unitId)
    .eq("building_id", buildingId)
    .eq("tenant_id", tenantId)
    .maybeSingle<FunctionalUnit>();

  if (error) {
    throw new Error(`No se pudo cargar la unidad: ${error.message}`);
  }

  if (!unit) {
    notFound();
  }

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Editar unidad funcional"
          description={`Edificio: ${building.name}`}
          backHref={`/buildings/${building.id}/units/${unit.id}`}
          backLabel="Volver al detalle"
        />
        {query?.error ? <Alert variant="error">{query.error}</Alert> : null}
        {unit.status === "archived" ? (
          <Alert variant="info">
            Las unidades archivadas son de solo lectura.
          </Alert>
        ) : (
          <FunctionalUnitForm
            action={updateFunctionalUnit}
            buildingId={building.id}
            submitLabel="Guardar cambios"
            unit={unit}
          />
        )}
      </Card>
    </PageShell>
  );
}
