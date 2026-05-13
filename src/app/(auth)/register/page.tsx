import Link from "next/link";
import { registerAdmin } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <section className="panel max-w-xl">
        <h1 className="mb-3 text-2xl font-semibold">
          Registro de administrador
        </h1>
        <p className="muted mb-6">
          La cuenta queda pendiente hasta que un superadmin apruebe la solicitud.
        </p>
        {params?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}
        <form action={registerAdmin} className="mb-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Nombre completo
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="full_name"
              required
              autoComplete="name"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Contraseña
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Teléfono
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="phone"
              autoComplete="tel"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Administradora
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="company_name"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            CUIT
            <input
              className="rounded-md border border-[var(--border)] px-3 py-2"
              name="cuit"
            />
          </label>
          <SubmitButton>Enviar solicitud</SubmitButton>
        </form>
        <Link className="text-sm text-[var(--accent)]" href="/login">
          Ya tengo cuenta
        </Link>
      </section>
    </main>
  );
}
