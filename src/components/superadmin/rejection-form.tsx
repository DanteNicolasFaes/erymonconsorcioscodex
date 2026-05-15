import { rejectAdminRequest } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { fieldStyles, FormField } from "@/components/ui/form-field";

type RejectionFormProps = {
  requestId: string;
};

export function RejectionForm({ requestId }: RejectionFormProps) {
  return (
    <form action={rejectAdminRequest} className="grid gap-3">
      <input type="hidden" name="admin_request_id" value={requestId} />
      <FormField label="Motivo de rechazo">
        <textarea
          className={`${fieldStyles} min-h-24`}
          name="rejection_reason"
          placeholder="Opcional"
        />
      </FormField>
      <SubmitButton variant="danger">Rechazar</SubmitButton>
    </form>
  );
}
