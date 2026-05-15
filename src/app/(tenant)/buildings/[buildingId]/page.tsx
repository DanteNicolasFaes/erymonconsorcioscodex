import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ArchiveButton } from "@/components/buildings/archive-button";
import {
  Alert,
  buttonStyles,
  Card,
  PageHeader,
  PageShell,
  StatusBadge
} from "@/components/ui";

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
    <PageShell>
      <Card>
        <PageHeader
          title={building.name}
          description={building.address || "Sin dirección"}
          backHref="/buildings"
          backLabel="Volver a Mis edificios"
          actions={
            <>
              <Link
                href={`/buildings/${building.id}/units`}
                className={buttonStyles({ variant: "secondary" })}
              >
                Unidades funcionales
              </Link>
              {building.status === "active" ? (
                <>
                  <Link
                    href={`/buildings/${building.id}/edit`}
                    className={buttonStyles({ variant: "secondary" })}
                  >
                    Editar
                  </Link>
                  <ArchiveButton buildingId={building.id} mode="archive" />
                </>
              ) : (
                <ArchiveButton buildingId={building.id} mode="unarchive" />
              )}
            </>
          }
        />
        {query?.error ? <Alert variant="error">{query.error}</Alert> : null}
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">CUIT</dt>
            <dd className="text-slate-500">{building.cuit || "Sin dato"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Estado</dt>
            <dd className="mt-1">
              <StatusBadge status={building.status} />
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Creado</dt>
            <dd className="text-slate-500">{formatDate(building.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Archivado</dt>
            <dd className="text-slate-500">
              {formatDate(building.archived_at)}
            </dd>
          </div>
        </dl>
      </Card>
    </PageShell>
  );
}
