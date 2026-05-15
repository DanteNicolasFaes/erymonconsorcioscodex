import { LogoutButton } from "@/components/auth/logout-button";
import { Card, PageHeader, PageShell, StatusBadge } from "@/components/ui";

export default function RequestRejectedPage() {
  return (
    <PageShell>
      <Card className="max-w-xl">
        <PageHeader
          title="Solicitud rechazada"
          description="La solicitud de alta no fue aprobada. En esta fase se muestra un estado simple sin flujo adicional."
          actions={<StatusBadge status="rejected" />}
        />
        <LogoutButton />
      </Card>
    </PageShell>
  );
}
