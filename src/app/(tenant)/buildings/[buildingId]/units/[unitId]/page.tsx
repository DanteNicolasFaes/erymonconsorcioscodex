import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ArchiveFunctionalUnitButton } from "@/components/functional-units/archive-functional-unit-button";

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

const occupancyLabels: Record<string, string> = {
  vacia: "Vacía",
  habitada: "Habitada",
  en_obra: "En obra",
  sin_datos: "Sin datos"
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
    return [
      {
        label: "Identificación",
        value: unit.unit_number || "Sin dato"
      }
    ];
  }

  if (unit.type === "local") {
    return [
      {
        label: "Nombre / número",
        value: unit.unit_number || "Sin dato"
      }
    ];
  }

  if (unit.type === "encargado") {
    return [
      {
        label: "Piso",
        value: unit.floor || "Sin dato"
      },
      {
        label: "Departamento / unidad",
        value: unit.unit_number || "Sin dato"
      }
    ];
  }

  return [
    {
      label: "Piso",
      value: unit.floor || "Sin dato"
    },
    {
      label: "Número",
      value: unit.unit_number || "Sin dato"
    }
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
    <main className="page-shell">
      <section className="panel">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <Link
              href={`/buildings/${building.id}/units`}
              className="text-sm text-[var(--accent)]"
            >
              Volver a unidades funcionales
            </Link>
            <h1 className="mt-3 text-2xl font-semibold">{unit.identifier}</h1>
            <p className="muted">{building.name}</p>
          </div>
          <div className="flex items-start gap-3">
            <Link
              href={`/buildings/${building.id}/units/new`}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
            >
              Crear otra unidad funcional
            </Link>
            {unit.status === "active" ? (
              <>
                <Link
                  href={`/buildings/${building.id}/units/${unit.id}/edit`}
                  className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
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
          </div>
        </div>
        {query?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {query.error}
          </p>
        ) : null}
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium">Tipo</dt>
            <dd className="muted">{typeLabels[unit.type] ?? unit.type}</dd>
          </div>
          <div>
            <dt className="font-medium">Ocupación</dt>
            <dd className="muted">
              {occupancyLabels[unit.occupancy_status] ??
                unit.occupancy_status}
            </dd>
          </div>
          {unitDetailFields(unit).map((field) => (
            <div key={field.label}>
              <dt className="font-medium">{field.label}</dt>
              <dd className="muted">{field.value}</dd>
            </div>
          ))}
          <div>
            <dt className="font-medium">Estado</dt>
            <dd className="muted">{unit.status}</dd>
          </div>
          <div>
            <dt className="font-medium">Creada</dt>
            <dd className="muted">{formatDate(unit.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium">Archivada</dt>
            <dd className="muted">{formatDate(unit.archived_at)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
