import Link from "next/link";
import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Alert,
  Card,
  fieldStyles,
  FormField,
  PageHeader,
  PageShell
} from "@/components/ui";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <PageShell>
      <Card className="max-w-md">
        <PageHeader
          title="Iniciar sesión"
          description="Ingresá con tu cuenta de Erymon."
        />
        {params?.error ? <Alert variant="error">{params.error}</Alert> : null}
        <form action={login} className="mb-6 grid gap-4">
          <FormField label="Email">
            <input
              className={fieldStyles}
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </FormField>
          <FormField label="Contraseña">
            <input
              className={fieldStyles}
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </FormField>
          <SubmitButton>Entrar</SubmitButton>
        </form>
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <Link className="text-indigo-700 hover:text-indigo-800" href="/register">
            Registrarse
          </Link>
          <Link
            className="text-indigo-700 hover:text-indigo-800"
            href="/forgot-password"
          >
            Recuperar contraseña
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
