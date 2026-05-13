import { SubmitButton } from "@/components/auth/submit-button";

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
      <label className="grid gap-2 text-sm font-medium">
        Nombre
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          name="name"
          defaultValue={building?.name ?? ""}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Dirección
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          name="address"
          defaultValue={building?.address ?? ""}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        CUIT
        <input
          className="rounded-md border border-[var(--border)] px-3 py-2"
          name="cuit"
          defaultValue={building?.cuit ?? ""}
        />
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
