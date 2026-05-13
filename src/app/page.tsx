import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="panel">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          Fase 1
        </p>
        <h1 className="mb-4 text-3xl font-semibold">Erymon Consorcios</h1>
        <p className="muted mb-6 max-w-2xl">
          Base inicial para administradoras aprobadas, tenants y gestion de
          edificios.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Registrarse
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium"
          >
            Iniciar sesion
          </Link>
        </div>
      </section>
    </main>
  );
}
