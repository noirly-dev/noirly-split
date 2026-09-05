import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@noirly-dev/ui";
import { auth } from "@/auth";
import { BrandMark } from "@/src/components/BrandMark";
import { MarketingHeader } from "@/src/components/MarketingHeader";
import { NoirlyLoginButton } from "@/src/features/auth/NoirlyLoginButton";

export const metadata: Metadata = {
  title: "Noirly Split",
  description:
    "Split shared costs with friends, roommates, and trip parties in the Noirly ecosystem.",
};

const features = [
  {
    title: "Groups",
    copy: "Trips, roommates, and friend circles in one place.",
  },
  {
    title: "Splits",
    copy: "Equal, unequal, percent, or shares — with receipts.",
  },
  {
    title: "Balances",
    copy: "Who owes whom, simplified to the fewest payments.",
  },
  {
    title: "Settlements",
    copy: "Record paybacks and settle up when you’re ready.",
  },
  {
    title: "Noirly Identity",
    copy: "Sign in once with email or Google. No new password to remember.",
  },
  {
    title: "Realtime",
    copy: "Expenses and balances update as they happen.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) {
    // Middleware also redirects signed-in `/` → `/home`; this is the RSC fallback.
    redirect("/home");
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <MarketingHeader />

      <main id="main" className="flex flex-1 flex-col">
        <section className="shell section-y">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <BrandMark className="h-20 w-20" />
            <p className="eyebrow mt-7">Shared expenses</p>
            <h1 className="display-lg mt-4 text-balance">
              Split costs. Settle up. Done.
            </h1>
            <p className="lede mt-5 text-center">
              Groups, splits, and simplified balances for friends, roommates, and
              trips — signed in through Noirly Identity.
            </p>

            <div className="mt-9 w-full max-w-xs">
              <NoirlyLoginButton redirectTo="/home" />
            </div>
            <p className="meta mt-4">Opens Noirly Identity in a secure popup</p>
          </div>
        </section>

        <section className="section-rule relative">
          <div className="shell section-y">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow justify-center">What is inside</p>
              <h2 className="display-md mt-4">Built for how groups actually spend</h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((item) => (
                <Card key={item.title} variant="interactive">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="copy">{item.copy}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="section-rule relative">
        <div className="shell flex flex-wrap items-center justify-between gap-4 py-7">
          <span className="flex items-center gap-2.5">
            <BrandMark className="h-6 w-6" />
            <span className="meta">Noirly Split</span>
          </span>
          <span className="meta">Groups · Splits · Settlements</span>
        </div>
      </footer>
    </div>
  );
}
