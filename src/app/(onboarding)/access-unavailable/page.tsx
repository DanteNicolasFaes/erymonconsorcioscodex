import { LogoutButton } from "@/components/auth/logout-button";
import { Card, PageHeader, PageShell } from "@/components/ui";

export default function AccessUnavailablePage() {
  return (
    <PageShell>
      <Card className="max-w-xl">
        <PageHeader
          title="Acceso no disponible"
          description="La cuenta está activa, pero todavía no tiene un rol operativo válido."
        />
        <LogoutButton />
      </Card>
    </PageShell>
  );
}
