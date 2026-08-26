import { signOutAction } from "@/src/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted transition-colors hover:text-ink"
      >
        Sign out
      </button>
    </form>
  );
}
