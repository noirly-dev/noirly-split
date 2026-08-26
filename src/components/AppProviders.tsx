"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
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
    <QueryClientProvider client={client}>
      <SplitRealtimeProvider>
        <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
      </SplitRealtimeProvider>
    </QueryClientProvider>
  );
}
