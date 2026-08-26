import { AppShell } from "@/src/components/AppShell";

export default function PersonalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
