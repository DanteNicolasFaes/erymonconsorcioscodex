import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateBuilding } from "@/app/actions/buildings";
import { BuildingForm } from "@/components/buildings/building-form";

export const dynamic = "force-dynamic";

type EditBuildingPageProps = {
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
};

export default async function EditBuildingPage({
  params,
  searchParams
}: EditBuildingPageProps) {
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
    .select("id,name,address,cuit,status")
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
        <div className="mb-6">
          <Link
            href={`/buildings/${building.id}`}
            className="text-sm text-[var(--accent)]"
          >
            Volver al detalle
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Editar edificio</h1>
        </div>
        {query?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {query.error}
          </p>
        ) : null}
        {building.status === "archived" ? (
          <p className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm">
            Los edificios archivados son de solo lectura.
          </p>
        ) : (
          <BuildingForm
            action={updateBuilding}
            submitLabel="Guardar cambios"
            building={building}
          />
        )}
      </section>
    </main>
  );
}
