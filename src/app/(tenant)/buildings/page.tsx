import Link from "next/link";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";
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

type Building = {
  id: string;
  name: string;
  address: string | null;
  cuit: string | null;
  status: "active" | "archived";
  created_at: string;
  archived_at: string | null;
};

type BuildingsPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
  }>;
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

export default async function BuildingsPage({ searchParams }: BuildingsPageProps) {
  const state = await requireTenantAdmin();
  const params = await searchParams;
  const selectedStatus = params?.status === "archived" ? "archived" : "active";
  const tenantId = state.tenantMembership?.tenant_id;

  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant activo.");
  }

  const supabase = await createClient();
  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("id,name,address,cuit,status,created_at,archived_at")
    .eq("tenant_id", tenantId)
    .eq("status", selectedStatus)
    .order("created_at", { ascending: false })
    .returns<Building[]>();

  if (error) {
    throw new Error(`No se pudieron cargar edificios: ${error.message}`);
  }

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Mis edificios"
          description="Administrá edificios activos y archivados."
          actions={
            <>
              <Link href="/buildings/new" className={buttonStyles()}>
                Crear edificio
              </Link>
              <LogoutButton />
            </>
          }
        />
        {params?.error ? <Alert variant="error">{params.error}</Alert> : null}
        <div className="mb-6 flex gap-3 text-sm font-medium">
          <Link
            href="/buildings"
            className={
              selectedStatus === "active"
                ? "text-indigo-700"
                : "text-slate-500 hover:text-indigo-700"
            }
          >
            Activos
          </Link>
          <Link
            href="/buildings?status=archived"
            className={
              selectedStatus === "archived"
                ? "text-indigo-700"
                : "text-slate-500 hover:text-indigo-700"
            }
          >
            Archivados
          </Link>
        </div>
        {!buildings?.length ? (
          <EmptyState
            title={
              selectedStatus === "active"
                ? "Todavía no hay edificios activos"
                : "No hay edificios archivados"
            }
            description="Los edificios que cargues van a aparecer en esta vista."
          />
        ) : (
          <div className="grid gap-4">
            {buildings.map((building) => (
              <article
                key={building.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      <Link href={`/buildings/${building.id}`}>
                        {building.name}
                      </Link>
                    </h2>
                    <p className="text-sm text-slate-500">
                      {building.address || "Sin dirección"}
                    </p>
                  </div>
                  <div className="grid gap-2 text-sm md:justify-items-end">
                    <StatusBadge status={building.status} />
                    <p className="text-slate-500">
                      Creado: {formatDate(building.created_at)}
                    </p>
                    {building.archived_at ? (
                      <p className="text-slate-500">
                        Archivado: {formatDate(building.archived_at)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-900">CUIT</dt>
                    <dd className="text-slate-500">
                      {building.cuit || "Sin dato"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">Detalle</dt>
                    <dd>
                      <Link
                        href={`/buildings/${building.id}`}
                        className="font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        Ver edificio
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
