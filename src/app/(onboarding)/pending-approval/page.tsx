import { LogoutButton } from "@/components/auth/logout-button";
import { Card, PageHeader, PageShell, StatusBadge } from "@/components/ui";

export default function PendingApprovalPage() {
  return (
    <PageShell>
      <Card className="max-w-xl">
        <PageHeader
          title="Tu cuenta está pendiente de aprobación"
          description="Un superadmin debe revisar la solicitud antes de habilitar el acceso."
          actions={<StatusBadge status="pending" />}
        />
        <LogoutButton />
      </Card>
    </PageShell>
  );
}
