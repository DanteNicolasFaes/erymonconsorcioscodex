import { LogoutButton } from "@/components/auth/logout-button";

export default function AccountDisabledPage() {
  return (
    <main className="page-shell">
      <section className="panel max-w-xl">
        <h1 className="mb-3 text-2xl font-semibold">Cuenta deshabilitada</h1>
        <p className="muted">
          Esta cuenta no puede operar el sistema. Contactá al equipo de Erymon.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
