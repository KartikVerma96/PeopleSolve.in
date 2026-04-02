import { MainShell } from "@/components/layout/main-shell";

/**
 * Authenticated / guest shell: sidebar + main content area.
 * (Route group — does not affect URLs.)
 */
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainShell>{children}</MainShell>;
}
