import type { Metadata } from "next";
import { NoirlyHead, noirlyFontClassName } from "@noirly-dev/ui";
import { NoirlyExperience } from "@noirly-dev/ui/experience";
import { AppProviders } from "@/src/components/AppProviders";
import { SPLIT_LOGO_URL } from "@/src/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noirly Split",
  description: "Split shared costs with friends, roommates, and trip parties",
  icons: {
    icon: [{ url: SPLIT_LOGO_URL, type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="dark h-full"
      data-theme="gold"
      suppressHydrationWarning
    >
      <head>
        <NoirlyHead themeId="gold" />
      </head>
      <body className={`${noirlyFontClassName} flex min-h-full flex-col antialiased`}>
        <NoirlyExperience mark="Noirly Split" pageTransition={false}>
          <AppProviders>{children}</AppProviders>
        </NoirlyExperience>
      </body>
    </html>
  );
}
