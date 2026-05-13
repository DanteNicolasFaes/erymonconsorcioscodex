import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createFunctionalUnit } from "@/app/actions/functional-units";
import { FunctionalUnitForm } from "@/components/functional-units/functional-unit-form";

type NewUnitPageProps = {
  params: Promise<{
    buildingId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    created?: string;
  }>;
};

type Building = {
  id: string;
  name: string;
  status: "active" | "archived";
};

export default async function NewUnitPage({
  params,
  searchParams
}: NewUnitPageProps) {
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
    .select("id,name,status")
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
            href={`/buildings/${building.id}/units`}
            className="text-sm text-[var(--accent)]"
          >
            Volver a unidades funcionales
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">
            Crear unidad funcional
          </h1>
          <p className="muted">{building.name}</p>
        </div>
        {query?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {query.error}
          </p>
        ) : null}
        {query?.created === "1" ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Unidad funcional creada correctamente. Podés cargar otra.
          </p>
        ) : null}
        {building.status === "archived" ? (
          <p className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm">
            No se pueden crear unidades en un edificio archivado.
          </p>
        ) : (
          <FunctionalUnitForm
            action={createFunctionalUnit}
            buildingId={building.id}
            submitLabel="Crear unidad funcional"
          />
        )}
      </section>
    </main>
  );
}
