import { signOutAction } from "@/src/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted-foreground-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
