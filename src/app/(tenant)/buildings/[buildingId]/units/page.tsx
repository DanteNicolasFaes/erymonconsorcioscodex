import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

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
  encargado: "Encargado"
};

const occupancyLabels: Record<string, string> = {
  vacia: "Vacía",
  habitada: "Habitada",
  en_obra: "En obra",
  sin_datos: "Sin datos"
};

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
    <main className="page-shell">
      <section className="panel">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <Link
              href={`/buildings/${building.id}`}
              className="text-sm text-[var(--accent)]"
            >
              Volver al edificio
            </Link>
            <h1 className="mt-3 text-2xl font-semibold">
              Unidades funcionales
            </h1>
            <p className="muted">{building.name}</p>
          </div>
          {building.status === "active" ? (
            <Link
              href={`/buildings/${building.id}/units/new`}
              className="self-start rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Crear unidad funcional
            </Link>
          ) : null}
        </div>
        {query?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {query.error}
          </p>
        ) : null}
        <div className="mb-6 flex gap-3 text-sm">
          <Link
            href={`/buildings/${building.id}/units`}
            className={
              selectedStatus === "active"
                ? "font-semibold text-[var(--accent)]"
                : "text-[var(--muted)]"
            }
          >
            Activas
          </Link>
          <Link
            href={`/buildings/${building.id}/units?status=archived`}
            className={
              selectedStatus === "archived"
                ? "font-semibold text-[var(--accent)]"
                : "text-[var(--muted)]"
            }
          >
            Archivadas
          </Link>
        </div>
        {!units?.length ? (
          <p className="muted">
            {selectedStatus === "active"
              ? "Todavía no hay unidades activas."
              : "No hay unidades archivadas."}
          </p>
        ) : (
          <div className="grid gap-4">
            {units.map((unit) => (
              <article
                key={unit.id}
                className="rounded-md border border-[var(--border)] bg-white p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <h2 className="text-lg font-semibold">
                      <Link href={`/buildings/${building.id}/units/${unit.id}`}>
                        {unit.identifier}
                      </Link>
                    </h2>
                    <p className="muted text-sm">
                      {typeLabels[unit.type] ?? unit.type}
                    </p>
                  </div>
                  <div className="text-sm md:text-right">
                    <p className="font-medium">{unit.status}</p>
                    <p className="muted">
                      {occupancyLabels[unit.occupancy_status] ??
                        unit.occupancy_status}
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <dt className="font-medium">Piso</dt>
                    <dd className="muted">{unit.floor || "Sin dato"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Número</dt>
                    <dd className="muted">{unit.unit_number || "Sin dato"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Detalle</dt>
                    <dd>
                      <Link
                        href={`/buildings/${building.id}/units/${unit.id}`}
                        className="text-[var(--accent)]"
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
      </section>
    </main>
  );
}
