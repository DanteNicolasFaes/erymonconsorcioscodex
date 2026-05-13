import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium"
      >
        Cerrar sesion
      </button>
    </form>
  );
}
