import { LogoutButton } from "@/components/auth/logout-button";

export default function RequestRejectedPage() {
  return (
    <main className="page-shell">
      <section className="panel max-w-xl">
        <h1 className="mb-3 text-2xl font-semibold">Solicitud rechazada</h1>
        <p className="muted">
          La solicitud de alta no fue aprobada. En esta fase se muestra un
          estado simple sin flujo adicional.
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
