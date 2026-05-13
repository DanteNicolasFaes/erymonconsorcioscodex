import { LogoutButton } from "@/components/auth/logout-button";

export default function PendingApprovalPage() {
  return (
    <main className="page-shell">
      <section className="panel max-w-xl">
        <h1 className="mb-3 text-2xl font-semibold">
          Tu cuenta esta pendiente de aprobacion
        </h1>
        <p className="muted">
          Un superadmin debe revisar la solicitud antes de habilitar el acceso.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
