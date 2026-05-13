import {
  archiveFunctionalUnit,
  unarchiveFunctionalUnit
} from "@/app/actions/functional-units";
import { SubmitButton } from "@/components/auth/submit-button";

type ArchiveFunctionalUnitButtonProps = {
  buildingId: string;
  unitId: string;
  mode: "archive" | "unarchive";
};

export function ArchiveFunctionalUnitButton({
  buildingId,
  unitId,
  mode
}: ArchiveFunctionalUnitButtonProps) {
  const isArchive = mode === "archive";

  return (
    <form action={isArchive ? archiveFunctionalUnit : unarchiveFunctionalUnit}>
      <input type="hidden" name="building_id" value={buildingId} />
      <input type="hidden" name="functional_unit_id" value={unitId} />
      <SubmitButton>{isArchive ? "Archivar" : "Desarchivar"}</SubmitButton>
    </form>
  );
}
