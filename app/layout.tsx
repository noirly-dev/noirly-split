import type { Metadata } from "next";
import { ThemeStyles, noirlyFontClassName } from "@noirly-dev/ui";
import { AppProviders } from "@/src/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noirly Split",
  description: "Split shared costs with friends, roommates, and trip parties",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${noirlyFontClassName} dark h-full`}
      data-theme="gold"
      suppressHydrationWarning
    >
      <head>
        <ThemeStyles themeId="gold" />
      </head>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
