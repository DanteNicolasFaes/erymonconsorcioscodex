import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ArchiveButton } from "@/components/buildings/archive-button";

export const dynamic = "force-dynamic";

type BuildingDetailPageProps = {
  params: Promise<{
    buildingId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

type Building = {
  id: string;
  name: string;
  address: string | null;
  cuit: string | null;
  status: "active" | "archived";
  created_at: string;
  archived_at: string | null;
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

export default async function BuildingDetailPage({
  params,
  searchParams
}: BuildingDetailPageProps) {
  const state = await requireTenantAdmin();
  const { buildingId } = await params;
  const query = await searchParams;
  const tenantId = state.tenantMembership?.tenant_id;

  if (!tenantId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: building, error } = await supabase
    .from("buildings")
    .select("id,name,address,cuit,status,created_at,archived_at")
    .eq("id", buildingId)
    .eq("tenant_id", tenantId)
    .maybeSingle<Building>();

  if (error) {
    throw new Error(`No se pudo cargar el edificio: ${error.message}`);
  }

  if (!building) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <Link href="/buildings" className="text-sm text-[var(--accent)]">
              Volver a Mis edificios
            </Link>
            <h1 className="mt-3 text-2xl font-semibold">{building.name}</h1>
            <p className="muted">{building.address || "Sin dirección"}</p>
          </div>
          <div className="flex items-start gap-3">
            <Link
              href={`/buildings/${building.id}/units`}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
            >
              Unidades funcionales
            </Link>
            {building.status === "active" ? (
              <>
                <Link
                  href={`/buildings/${building.id}/edit`}
                  className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
                >
                  Editar
                </Link>
                <ArchiveButton buildingId={building.id} mode="archive" />
              </>
            ) : (
              <ArchiveButton buildingId={building.id} mode="unarchive" />
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
            <dt className="font-medium">CUIT</dt>
            <dd className="muted">{building.cuit || "Sin dato"}</dd>
          </div>
          <div>
            <dt className="font-medium">Estado</dt>
            <dd className="muted">{building.status}</dd>
          </div>
          <div>
            <dt className="font-medium">Creado</dt>
            <dd className="muted">{formatDate(building.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium">Archivado</dt>
            <dd className="muted">{formatDate(building.archived_at)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
