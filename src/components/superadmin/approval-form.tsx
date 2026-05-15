import { approveAdminRequest } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/auth/submit-button";
import { fieldStyles, FormField } from "@/components/ui/form-field";

type ApprovalFormProps = {
  request: {
    id: string;
    company_name: string;
    cuit: string | null;
  };
};

export function ApprovalForm({ request }: ApprovalFormProps) {
  return (
    <form action={approveAdminRequest} className="grid gap-3">
      <input type="hidden" name="admin_request_id" value={request.id} />
      <FormField label="Nombre del tenant">
        <input
          className={fieldStyles}
          name="tenant_name"
          defaultValue={request.company_name}
          required
        />
      </FormField>
      <input
        type="hidden"
        name="tenant_legal_name"
        value={request.company_name}
      />
      <input type="hidden" name="tenant_cuit" value={request.cuit ?? ""} />
      <SubmitButton>Aprobar</SubmitButton>
    </form>
  );
}
