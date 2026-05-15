import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  Alert,
  buttonStyles,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  StatusBadge
} from "@/components/ui";

export const dynamic = "force-dynamic";

type UnitsPageProps = {
  params: Promise<{
    buildingId: string;
  }>;
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
};

type Building = {
  id: string;
  name: string;
  status: "active" | "archived";
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

const typeLabels: Record<string, string> = {
  departamento: "Departamento",
  cochera: "Cochera",
  baulera: "Baulera",
  local: "Local",
  encargado: "Vivienda del encargado"
};

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

export default async function UnitsPage({
  params,
  searchParams
}: UnitsPageProps) {
  const state = await requireTenantAdmin();
  const { buildingId } = await params;
  const query = await searchParams;
  const selectedStatus = query?.status === "archived" ? "archived" : "active";
  const tenantId = state.tenantMembership?.tenant_id;

  if (!tenantId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .select("id,name,status")
    .eq("id", buildingId)
    .eq("tenant_id", tenantId)
    .maybeSingle<Building>();

  if (buildingError) {
    throw new Error(`No se pudo cargar el edificio: ${buildingError.message}`);
  }

  if (!building) {
    notFound();
  }

  const { data: units, error } = await supabase
    .from("functional_units")
    .select("id,type,identifier,floor,unit_number,occupancy_status,status")
    .eq("tenant_id", tenantId)
    .eq("building_id", buildingId)
    .eq("status", selectedStatus)
    .order("identifier", { ascending: true })
    .returns<FunctionalUnit[]>();

  if (error) {
    throw new Error(`No se pudieron cargar unidades: ${error.message}`);
  }

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Unidades funcionales"
          description={building.name}
          backHref={`/buildings/${building.id}`}
          backLabel="Volver al edificio"
          actions={
            building.status === "active" ? (
              <Link
                href={`/buildings/${building.id}/units/new`}
                className={buttonStyles()}
              >
                Crear unidad funcional
              </Link>
            ) : null
          }
        />
        {query?.error ? <Alert variant="error">{query.error}</Alert> : null}
        <div className="mb-6 flex gap-3 text-sm font-medium">
          <Link
            href={`/buildings/${building.id}/units`}
            className={
              selectedStatus === "active"
                ? "text-indigo-700"
                : "text-slate-500 hover:text-indigo-700"
            }
          >
            Activas
          </Link>
          <Link
            href={`/buildings/${building.id}/units?status=archived`}
            className={
              selectedStatus === "archived"
                ? "text-indigo-700"
                : "text-slate-500 hover:text-indigo-700"
            }
          >
            Archivadas
          </Link>
        </div>
        {!units?.length ? (
          <EmptyState
            title={
              selectedStatus === "active"
                ? "Todavía no hay unidades activas"
                : "No hay unidades archivadas"
            }
            description="Las unidades funcionales cargadas para este edificio aparecerán acá."
          />
        ) : (
          <div className="grid gap-4">
            {units.map((unit) => (
              <article
                key={unit.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      <Link href={`/buildings/${building.id}/units/${unit.id}`}>
                        {unit.identifier}
                      </Link>
                    </h2>
                    <p className="text-sm text-slate-500">
                      {typeLabels[unit.type] ?? unit.type}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <StatusBadge status={unit.status} />
                    <StatusBadge status={unit.occupancy_status} />
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  {unitDetailFields(unit).map((field) => (
                    <div key={field.label}>
                      <dt className="font-medium text-slate-900">
                        {field.label}
                      </dt>
                      <dd className="text-slate-500">{field.value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="font-medium text-slate-900">Detalle</dt>
                    <dd>
                      <Link
                        href={`/buildings/${building.id}/units/${unit.id}`}
                        className="font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        Ver unidad
                      </Link>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
