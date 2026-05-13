import Link from "next/link";
import { requireTenantAdmin } from "@/lib/auth/guards";
import { createBuilding } from "@/app/actions/buildings";
import { BuildingForm } from "@/components/buildings/building-form";

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
    <main className="page-shell">
      <section className="panel">
        <div className="mb-6">
          <Link href="/buildings" className="text-sm text-[var(--accent)]">
            Volver a Mis edificios
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">Crear edificio</h1>
        </div>
        {params?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}
        <BuildingForm action={createBuilding} submitLabel="Crear edificio" />
      </section>
    </main>
  );
}
