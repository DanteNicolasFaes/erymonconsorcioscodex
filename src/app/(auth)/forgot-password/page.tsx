import Link from "next/link";
import { forgotPassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <section className="panel max-w-md">
        <h1 className="mb-3 text-2xl font-semibold">Recuperar contraseña</h1>
        <p className="muted mb-6">
          Ingresá tu email para recibir instrucciones de recuperación.
        </p>
        {params?.error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        ) : null}
        {params?.message ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {params.message}
          </p>
        ) : null}
        <form action={forgotPassword} className="mb-6 grid gap-4">
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
          <SubmitButton>Enviar instrucciones</SubmitButton>
        </form>
        <Link className="text-sm text-[var(--accent)]" href="/login">
          Volver al login
        </Link>
      </section>
    </main>
  );
}
