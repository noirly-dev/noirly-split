"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { SplitBusyScreen } from "@/src/components/SplitBusyScreen";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

function LoginPopupInner() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    void signIn(
      "noirly",
      {
        redirectTo: `/login/popup-complete?next=${encodeURIComponent(next)}`,
        callbackUrl: `/login/popup-complete?next=${encodeURIComponent(next)}`,
      },
      { display: "popup", prompt: "select_account" },
    );
  }, [next]);

  return <SplitBusyScreen label="Signing in to Split" />;
}

export default function LoginPopupPage() {
  return (
    <Suspense fallback={<SplitBusyScreen label="Signing in to Split" />}>
      <LoginPopupInner />
    </Suspense>
  );
}
