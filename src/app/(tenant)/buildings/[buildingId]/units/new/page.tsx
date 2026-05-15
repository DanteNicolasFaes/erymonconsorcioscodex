import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createFunctionalUnit } from "@/app/actions/functional-units";
import { FunctionalUnitForm } from "@/components/functional-units/functional-unit-form";
import { Alert, Card, PageHeader, PageShell } from "@/components/ui";

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
    <PageShell>
      <Card>
        <PageHeader
          title="Crear unidad funcional"
          description={`Edificio: ${building.name}`}
          backHref={`/buildings/${building.id}/units`}
          backLabel="Volver a unidades funcionales"
        />
        {query?.error ? <Alert variant="error">{query.error}</Alert> : null}
        {query?.created === "1" ? (
          <Alert variant="success">
            <p>Unidad funcional creada correctamente. Podés cargar otra.</p>
            <Link
              href={`/buildings/${building.id}/units`}
              className="mt-2 inline-flex font-medium text-emerald-800 underline-offset-4 hover:underline"
            >
              Ver unidades funcionales
            </Link>
          </Alert>
        ) : null}
        {building.status === "archived" ? (
          <Alert variant="info">
            No se pueden crear unidades en un edificio archivado.
          </Alert>
        ) : (
          <FunctionalUnitForm
            action={createFunctionalUnit}
            buildingId={building.id}
            submitLabel="Crear unidad funcional"
          />
        )}
      </Card>
    </PageShell>
  );
}
