"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { DEFAULT_THEME_ID } from "@noirly-dev/ui";
import { ThemeProvider } from "@/src/components/ThemeProvider";
import { SplitRealtimeProvider } from "@/src/features/realtime/SplitRealtimeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider defaultThemeId={DEFAULT_THEME_ID}>
      <QueryClientProvider client={client}>
        <SplitRealtimeProvider>
          <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
        </SplitRealtimeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
