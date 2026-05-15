import { requireSuperadmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";
import { ApprovalForm } from "@/components/superadmin/approval-form";
import { RejectionForm } from "@/components/superadmin/rejection-form";
import {
  Alert,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
  StatusBadge
} from "@/components/ui";

export const dynamic = "force-dynamic";

type AdminRequest = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string;
  cuit: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type SuperadminRequestsPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function SuperadminRequestsPage({
  searchParams
}: SuperadminRequestsPageProps) {
  await requireSuperadmin();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: requests, error } = await supabase
    .from("admin_requests")
    .select("id,full_name,email,phone,company_name,cuit,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<AdminRequest[]>();

  if (error) {
    throw new Error(`No se pudieron cargar solicitudes: ${error.message}`);
  }

  return (
    <PageShell>
      <Card>
        <PageHeader
          title="Solicitudes pendientes"
          description="Revisión de altas de administradores."
          actions={<LogoutButton />}
        />
        {params?.error ? <Alert variant="error">{params.error}</Alert> : null}
        {params?.message ? (
          <Alert variant="success">{params.message}</Alert>
        ) : null}
        {!requests?.length ? (
          <EmptyState
            title="No hay solicitudes pendientes"
            description="Cuando llegue una nueva solicitud de administrador, aparecerá en esta lista."
          />
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {request.full_name ?? "Sin nombre"}
                    </h2>
                    <p className="text-sm text-slate-500">{request.email}</p>
                  </div>
                  <div className="text-sm md:text-right">
                    <p className="font-medium text-slate-900">
                      {request.company_name}
                    </p>
                    <p className="text-slate-500">
                      Creada: {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>
                <dl className="mb-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-900">Teléfono</dt>
                    <dd className="text-slate-500">
                      {request.phone || "Sin dato"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">CUIT</dt>
                    <dd className="text-slate-500">
                      {request.cuit || "Sin dato"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-900">Estado</dt>
                    <dd className="mt-1">
                      <StatusBadge status={request.status} />
                    </dd>
                  </div>
                </dl>
                <div className="grid gap-4 md:grid-cols-2">
                  <ApprovalForm request={request} />
                  <RejectionForm requestId={request.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
