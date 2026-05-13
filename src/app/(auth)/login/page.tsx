import Link from "next/link";
import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <section className="panel max-w-md">
        <h1 className="mb-3 text-2xl font-semibold">Iniciar sesion</h1>
        <p className="muted mb-6">Ingresá con tu cuenta de Erymon.</p>
        {params?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}
        <form action={login} className="mb-6 grid gap-4">
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
              autoComplete="current-password"
            />
          </label>
          <SubmitButton>Entrar</SubmitButton>
        </form>
        <div className="flex gap-3 text-sm">
          <Link className="text-[var(--accent)]" href="/register">
            Registrarse
          </Link>
          <Link className="text-[var(--accent)]" href="/forgot-password">
            Recuperar contraseña
          </Link>
        </div>
      </section>
    </main>
  );
}
