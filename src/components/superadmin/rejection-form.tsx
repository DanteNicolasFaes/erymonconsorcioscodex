import { rejectAdminRequest } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";

type RejectionFormProps = {
  requestId: string;
};

export function RejectionForm({ requestId }: RejectionFormProps) {
  return (
    <form action={rejectAdminRequest} className="grid gap-3">
      <input type="hidden" name="admin_request_id" value={requestId} />
      <label className="grid gap-1 text-sm font-medium">
        Motivo de rechazo
        <textarea
          className="min-h-20 rounded-md border border-[var(--border)] px-3 py-2"
          name="rejection_reason"
          placeholder="Opcional"
        />
      </label>
      <SubmitButton>Rechazar</SubmitButton>
    </form>
  );
}
