import { logout } from "@/app/actions/auth";
import { buttonStyles } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={buttonStyles({ variant: "secondary" })}
      >
        Cerrar sesión
      </button>
    </form>
  );
}
