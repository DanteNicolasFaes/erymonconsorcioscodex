import Link from "next/link";
import { buttonStyles, Card, PageShell } from "@/components/ui";

export default function HomePage() {
  return (
    <PageShell>
      <Card>
        <p className="mb-2 text-sm font-semibold uppercase text-indigo-700">
          Fase 1
        </p>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900">
          Erymon Consorcios
        </h1>
        <p className="mb-6 max-w-2xl text-sm text-slate-500">
          Base inicial para administradoras aprobadas, tenants y gestión de
          edificios.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className={buttonStyles()}>
            Registrarse
          </Link>
          <Link href="/login" className={buttonStyles({ variant: "secondary" })}>
            Iniciar sesión
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
