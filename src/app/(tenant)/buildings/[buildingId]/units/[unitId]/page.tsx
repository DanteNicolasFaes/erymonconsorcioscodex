import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ArchiveFunctionalUnitButton } from "@/components/functional-units/archive-functional-unit-button";
import {
  Alert,
  buttonStyles,
  Card,
  PageHeader,
  PageShell,
  StatusBadge
} from "@/components/ui";

export const dynamic = "force-dynamic";

type UnitDetailPageProps = {
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
  created_at: string;
  archived_at: string | null;
};

const typeLabels: Record<string, string> = {
  departamento: "Departamento",
  cochera: "Cochera",
  baulera: "Baulera",
  local: "Local",
  encargado: "Vivienda del encargado"
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function unitDetailFields(unit: FunctionalUnit) {
  if (unit.type === "cochera" || unit.type === "baulera") {
    return [{ label: "Identificación", value: unit.unit_number || "Sin dato" }];
  }

  if (unit.type === "local") {
    return [{ label: "Nombre / número", value: unit.unit_number || "Sin dato" }];
  }

  if (unit.type === "encargado") {
    return [
      { label: "Piso", value: unit.floor || "Sin dato" },
      { label: "Departamento / unidad", value: unit.unit_number || "Sin dato" }
    ];
  }

  return [
    { label: "Piso", value: unit.floor || "Sin dato" },
    { label: "Número", value: unit.unit_number || "Sin dato" }
  ];
}

export default async function UnitDetailPage({
  params,
  searchParams
}: UnitDetailPageProps) {
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
    .select(
      "id,type,identifier,floor,unit_number,occupancy_status,status,created_at,archived_at"
    )
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
          title={unit.identifier}
          description={building.name}
          backHref={`/buildings/${building.id}/units`}
          backLabel="Volver a unidades funcionales"
          actions={
            <>
              <Link
                href={`/buildings/${building.id}/units/new`}
                className={buttonStyles({ variant: "secondary" })}
              >
                Crear otra unidad funcional
              </Link>
              {unit.status === "active" ? (
                <>
                  <Link
                    href={`/buildings/${building.id}/units/${unit.id}/edit`}
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    Editar
                  </Link>
                  <ArchiveFunctionalUnitButton
                    buildingId={building.id}
                    unitId={unit.id}
                    mode="archive"
                  />
                </>
              ) : (
                <ArchiveFunctionalUnitButton
                  buildingId={building.id}
                  unitId={unit.id}
                  mode="unarchive"
                />
              )}
            </>
          }
        />
        {query?.error ? <Alert variant="error">{query.error}</Alert> : null}
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">Tipo</dt>
            <dd className="text-slate-500">{typeLabels[unit.type] ?? unit.type}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Ocupación</dt>
            <dd className="mt-1">
              <StatusBadge status={unit.occupancy_status} />
            </dd>
          </div>
          {unitDetailFields(unit).map((field) => (
            <div key={field.label}>
              <dt className="font-medium text-slate-900">{field.label}</dt>
              <dd className="text-slate-500">{field.value}</dd>
            </div>
          ))}
          <div>
            <dt className="font-medium text-slate-900">Estado</dt>
            <dd className="mt-1">
              <StatusBadge status={unit.status} />
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Creada</dt>
            <dd className="text-slate-500">{formatDate(unit.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Archivada</dt>
            <dd className="text-slate-500">{formatDate(unit.archived_at)}</dd>
          </div>
        </dl>
      </Card>
    </PageShell>
  );
}
