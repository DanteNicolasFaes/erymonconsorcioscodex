import { requireSuperadmin } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";
import { ApprovalForm } from "@/components/superadmin/approval-form";
import { RejectionForm } from "@/components/superadmin/rejection-form";

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
    <main className="page-shell">
      <section className="panel">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Solicitudes pendientes</h1>
          <LogoutButton />
        </div>
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
        {!requests?.length ? (
          <p className="muted">No hay solicitudes pendientes.</p>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-md border border-[var(--border)] bg-white p-4"
              >
                <div className="mb-4 grid gap-2 md:grid-cols-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {request.full_name ?? "Sin nombre"}
                    </h2>
                    <p className="muted text-sm">{request.email}</p>
                  </div>
                  <div className="text-sm md:text-right">
                    <p className="font-medium">{request.company_name}</p>
                    <p className="muted">
                      Creada: {formatDate(request.created_at)}
                    </p>
                  </div>
                </div>
                <dl className="mb-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <dt className="font-medium">Teléfono</dt>
                    <dd className="muted">{request.phone || "Sin dato"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">CUIT</dt>
                    <dd className="muted">{request.cuit || "Sin dato"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Estado</dt>
                    <dd className="muted">{request.status}</dd>
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
      </section>
    </main>
  );
}
