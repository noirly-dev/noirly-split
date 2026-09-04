import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { DotMatrixNumeral } from "@/src/components/DotMatrix";
import { NoirlyLoginButton } from "@/src/features/auth/NoirlyLoginButton";
import { ensureSplitAccount } from "@/src/server/auth/bootstrap";

export const metadata: Metadata = {
  title: "Noirly Split",
  description:
    "Split shared costs with friends, roommates, and trip parties in the Noirly ecosystem.",
};

const features = [
  {
    index: "01",
    title: "Groups",
    copy: "Trips, roommates, and friend circles in one place.",
  },
  {
    index: "02",
    title: "Splits",
    copy: "Equal, unequal, percent, or shares — with receipts.",
  },
  {
    index: "03",
    title: "Balances",
    copy: "Who owes whom, simplified to the fewest payments.",
  },
  {
    index: "04",
    title: "Settlements",
    copy: "Record paybacks and settle up when you’re ready.",
  },
  {
    index: "05",
    title: "Identity",
    copy: "Sign in once with Noirly Identity — email or Google.",
  },
  {
    index: "06",
    title: "Realtime",
    copy: "Expenses and balances update as they happen.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) {
    await ensureSplitAccount({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
    redirect("/home");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-6 border-b border-[var(--hairline)] px-5 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-light.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 border border-[var(--hairline)] dark:hidden md:h-12 md:w-12"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt=""
            width={48}
            height={48}
            className="hidden h-11 w-11 border border-[var(--hairline)] dark:block md:h-12 md:w-12"
            priority
          />
          <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase md:text-2xl">
            Noirly Split
          </p>
        </div>
        <Link
          href="/login"
          className="font-mono text-[11px] font-semibold tracking-[0.16em] uppercase transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
        >
          Sign in
        </Link>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="pointer-events-none hidden w-10 shrink-0 items-center justify-center border-r border-[var(--hairline)] lg:flex">
          <span className="font-mono text-[10px] font-medium tracking-[0.28em] uppercase [writing-mode:vertical-rl] rotate-180">
            split.noirly.com
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <section className="relative overflow-hidden px-5 py-12 md:px-12 md:py-20">
            <div className="mb-8 flex items-center gap-5">
              <Image
                src="/logo-light.png"
                alt=""
                width={96}
                height={96}
                className="h-20 w-20 border border-[var(--hairline)] dark:hidden md:h-24 md:w-24"
                priority
              />
              <Image
                src="/logo-dark.png"
                alt=""
                width={96}
                height={96}
                className="hidden h-20 w-20 border border-[var(--hairline)] dark:block md:h-24 md:w-24"
                priority
              />
              <div>
                <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--muted-foreground)]">
                  Splitting 1.0
                </p>
                <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--muted-foreground)]">
                  Split. Settle. Done.
                </p>
              </div>
            </div>
            <h1 className="text-perforated mt-4 max-w-[10ch] font-display text-[18vw] leading-[0.8] font-bold tracking-[-0.07em] uppercase md:text-[9rem]">
              Split
            </h1>
            <DotMatrixNumeral className="mt-6 block text-5xl md:text-7xl">
              1.0
            </DotMatrixNumeral>
          </section>

          <section className="bg-[var(--accent)] px-5 py-10 text-[var(--accent-ink)] md:px-12 md:py-14">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--accent-ink)]/50">
              Shared expenses
            </p>
            <p className="mt-4 max-w-2xl font-display text-2xl leading-snug font-medium tracking-[-0.03em] md:text-4xl">
              Groups, splits, and simplified balances for friends, roommates,
              and trips — signed in through Noirly Identity.
            </p>
            <div className="mt-8 flex max-w-sm flex-col gap-3">
              <NoirlyLoginButton redirectTo="/home" />
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-[var(--accent-ink)]/50">
                Opens Identity in a secure popup
              </p>
            </div>
          </section>

          <section className="relative border-t border-[var(--hairline)]">
            <div className="relative min-h-[200px] w-full bg-[var(--surface)] md:min-h-[280px]">
              <Image
                src="/feature-light.png"
                alt="Noirly Split"
                fill
                className="object-contain p-8 dark:hidden md:p-12"
                sizes="100vw"
                priority
              />
              <Image
                src="/feature-dark.png"
                alt="Noirly Split"
                fill
                className="hidden object-contain p-8 dark:block md:p-12"
                sizes="100vw"
                priority
              />
            </div>
          </section>

          <section className="grid gap-0 border-t border-[var(--hairline)] md:grid-cols-2 xl:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.index}
                className="flex min-h-44 flex-col justify-between gap-6 border-b border-r border-[var(--hairline)] px-5 py-8 md:px-8"
              >
                <DotMatrixNumeral className="text-3xl">{item.index}</DotMatrixNumeral>
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.03em]">
                    {item.title}
                  </h2>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.08em] uppercase opacity-60">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] px-5 py-6 font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--muted-foreground)] md:px-12">
            <span className="flex items-center gap-3">
              <Image
                src="/logo-light.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 dark:hidden"
              />
              <Image
                src="/logo-dark.png"
                alt=""
                width={28}
                height={28}
                className="hidden h-7 w-7 dark:block"
              />
              Noirly Split
            </span>
            <span>Groups / Splits / Settlements</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
