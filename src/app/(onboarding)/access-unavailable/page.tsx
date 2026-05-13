import { LogoutButton } from "@/components/auth/logout-button";

export default function AccessUnavailablePage() {
  return (
    <main className="page-shell">
      <section className="panel max-w-xl">
        <h1 className="mb-3 text-2xl font-semibold">Acceso no disponible</h1>
        <p className="muted">
          La cuenta está activa, pero todavía no tiene un rol operativo válido.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
