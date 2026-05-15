import { LogoutButton } from "@/components/auth/logout-button";
import { Card, PageHeader, PageShell, StatusBadge } from "@/components/ui";

export default function AccountDisabledPage() {
  return (
    <PageShell>
      <Card className="max-w-xl">
        <PageHeader
          title="Cuenta deshabilitada"
          description="Esta cuenta no puede operar el sistema. Contactá al equipo de Erymon."
          actions={<StatusBadge status="disabled" />}
        />
        <LogoutButton />
      </Card>
    </PageShell>
  );
}
