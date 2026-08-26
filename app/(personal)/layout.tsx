import Link from "next/link";
import { NotificationBell } from "@/src/features/notifications/NotificationBell";
import { SignOutButton } from "@/src/features/auth/SignOutButton";

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-dashed border-hairline px-5 py-4 md:px-10">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-[-0.04em] uppercase"
        >
          Noirly Split
        </Link>
        <nav className="flex items-center gap-6">
          <NotificationBell />
          <Link
            href="/groups/new"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted transition-colors hover:text-ink"
          >
            New group
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <main className="flex flex-1 flex-col px-5 py-8 md:px-10 md:py-12">
        {children}
      </main>
    </div>
  );
}
