import { SubmitButton } from "@/components/auth/submit-button";
import { fieldStyles, FormField } from "@/components/ui/form-field";

type BuildingFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  building?: {
    id: string;
    name: string;
    address: string | null;
    cuit: string | null;
  };
};

export function BuildingForm({
  action,
  submitLabel,
  building
}: BuildingFormProps) {
  return (
    <form action={action} className="grid max-w-xl gap-4">
      {building ? (
        <input type="hidden" name="building_id" value={building.id} />
      ) : null}
      <FormField label="Nombre">
        <input
          className={fieldStyles}
          name="name"
          defaultValue={building?.name ?? ""}
          required
        />
      </FormField>
      <FormField label="Dirección">
        <input
          className={fieldStyles}
          name="address"
          defaultValue={building?.address ?? ""}
        />
      </FormField>
      <FormField label="CUIT">
        <input
          className={fieldStyles}
          name="cuit"
          defaultValue={building?.cuit ?? ""}
        />
      </FormField>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
