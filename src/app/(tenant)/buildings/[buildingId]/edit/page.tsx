import { notFound } from "next/navigation";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { updateBuilding } from "@/app/actions/buildings";
import { BuildingForm } from "@/components/buildings/building-form";
import { Alert, Card, PageHeader, PageShell } from "@/components/ui";

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
    <PageShell>
      <Card>
        <PageHeader
          title="Editar edificio"
          backHref={`/buildings/${building.id}`}
          backLabel="Volver al detalle"
        />
        {query?.error ? <Alert variant="error">{query.error}</Alert> : null}
        {building.status === "archived" ? (
          <Alert variant="info">Los edificios archivados son de solo lectura.</Alert>
        ) : (
          <BuildingForm
            action={updateBuilding}
            submitLabel="Guardar cambios"
            building={building}
          />
        )}
      </Card>
    </PageShell>
  );
}
