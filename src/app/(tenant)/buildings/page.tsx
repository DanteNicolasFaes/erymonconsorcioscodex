import Link from "next/link";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

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
    <main className="page-shell">
      <section className="panel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Mis edificios</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/buildings/new"
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Crear edificio
            </Link>
            <LogoutButton />
          </div>
        </div>
        {params?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}
        <div className="mb-6 flex gap-3 text-sm">
          <Link
            href="/buildings"
            className={
              selectedStatus === "active"
                ? "font-semibold text-[var(--accent)]"
                : "text-[var(--muted)]"
            }
          >
            Activos
          </Link>
          <Link
            href="/buildings?status=archived"
            className={
              selectedStatus === "archived"
                ? "font-semibold text-[var(--accent)]"
                : "text-[var(--muted)]"
            }
          >
            Archivados
          </Link>
        </div>
        {!buildings?.length ? (
          <p className="muted">
            {selectedStatus === "active"
              ? "Todavía no hay edificios activos."
              : "No hay edificios archivados."}
          </p>
        ) : (
          <div className="grid gap-4">
            {buildings.map((building) => (
              <article
                key={building.id}
                className="rounded-md border border-[var(--border)] bg-white p-4"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <h2 className="text-lg font-semibold">
                      <Link href={`/buildings/${building.id}`}>
                        {building.name}
                      </Link>
                    </h2>
                    <p className="muted text-sm">
                      {building.address || "Sin dirección"}
                    </p>
                  </div>
                  <div className="text-sm md:text-right">
                    <p className="font-medium">{building.status}</p>
                    <p className="muted">Creado: {formatDate(building.created_at)}</p>
                    {building.archived_at ? (
                      <p className="muted">
                        Archivado: {formatDate(building.archived_at)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-medium">CUIT</dt>
                    <dd className="muted">{building.cuit || "Sin dato"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Detalle</dt>
                    <dd>
                      <Link
                        href={`/buildings/${building.id}`}
                        className="text-[var(--accent)]"
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
      </section>
    </main>
  );
}
