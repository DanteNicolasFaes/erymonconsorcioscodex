import Link from "next/link";
import { forgotPassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Alert,
  Card,
  fieldStyles,
  FormField,
  PageHeader,
  PageShell
} from "@/components/ui";

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
    <PageShell>
      <Card className="max-w-md">
        <PageHeader
          title="Recuperar contraseña"
          description="Ingresá tu email para recibir instrucciones de recuperación."
        />
        {params?.error ? <Alert variant="error">{params.error}</Alert> : null}
        {params?.message ? (
          <Alert variant="success">{params.message}</Alert>
        ) : null}
        <form action={forgotPassword} className="mb-6 grid gap-4">
          <FormField label="Email">
            <input
              className={fieldStyles}
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </FormField>
          <SubmitButton>Enviar instrucciones</SubmitButton>
        </form>
        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-800" href="/login">
          Volver al login
        </Link>
      </Card>
    </PageShell>
  );
}
