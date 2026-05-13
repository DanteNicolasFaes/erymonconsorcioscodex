import {
  archiveBuilding,
  unarchiveBuilding
} from "@/app/actions/buildings";
import { SubmitButton } from "@/components/auth/submit-button";

type ArchiveButtonProps = {
  buildingId: string;
  mode: "archive" | "unarchive";
};

export function ArchiveButton({ buildingId, mode }: ArchiveButtonProps) {
  const isArchive = mode === "archive";

  return (
    <form action={isArchive ? archiveBuilding : unarchiveBuilding}>
      <input type="hidden" name="building_id" value={buildingId} />
      <SubmitButton>{isArchive ? "Archivar" : "Desarchivar"}</SubmitButton>
    </form>
  );
}
