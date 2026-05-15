import { requireTenantAdmin } from "@/lib/auth/guards";
import { createBuilding } from "@/app/actions/buildings";
import { BuildingForm } from "@/components/buildings/building-form";
import { Alert, Card, PageHeader, PageShell } from "@/components/ui";

type NewBuildingPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewBuildingPage({
  searchParams
}: NewBuildingPageProps) {
  await requireTenantAdmin();
  const params = await searchParams;

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Crear edificio"
          backHref="/buildings"
          backLabel="Volver a Mis edificios"
        />
        {params?.error ? <Alert variant="error">{params.error}</Alert> : null}
        <BuildingForm action={createBuilding} submitLabel="Crear edificio" />
      </Card>
    </PageShell>
  );
}
