import Link from "next/link";
import { registerAdmin } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  Alert,
  Card,
  fieldStyles,
  FormField,
  PageHeader,
  PageShell
} from "@/components/ui";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <PageShell>
      <Card className="max-w-xl">
        <PageHeader
          title="Registro de administrador"
          description="La cuenta queda pendiente hasta que un superadmin apruebe la solicitud."
        />
        {params?.error ? <Alert variant="error">{params.error}</Alert> : null}
        <form action={registerAdmin} className="mb-6 grid gap-4">
          <FormField label="Nombre completo">
            <input
              className={fieldStyles}
              name="full_name"
              required
              autoComplete="name"
            />
          </FormField>
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
              minLength={6}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Teléfono">
            <input className={fieldStyles} name="phone" autoComplete="tel" />
          </FormField>
          <FormField label="Administradora">
            <input className={fieldStyles} name="company_name" required />
          </FormField>
          <FormField label="CUIT">
            <input className={fieldStyles} name="cuit" />
          </FormField>
          <SubmitButton>Enviar solicitud</SubmitButton>
        </form>
        <Link className="text-sm font-medium text-indigo-700 hover:text-indigo-800" href="/login">
          Ya tengo cuenta
        </Link>
      </Card>
    </PageShell>
  );
}
