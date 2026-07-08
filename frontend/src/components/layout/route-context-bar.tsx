"use client";

import { usePathname } from "next/navigation";

/** Context for deeper routes — home, auth, and composer keep their own headings. */
const ROUTES: Record<string, { title: string; subtitle: string }> = {
  "/messages": {
    title: "Messages",
    subtitle: "1:1 threads when you help or get helped on a doubt.",
  },
  "/profile": {
    title: "Profile & karma",
    subtitle: "Your reputation and activity — sign in to track karma.",
  },
  "/leaderboard": {
    title: "Leaderboard",
    subtitle: "Top helpers ranked by karma — earn more by solving doubts.",
  },
  "/explore": {
    title: "Explore",
    subtitle: "Browse doubts by exam, subject, or keyword.",
  },
  "/tricks": {
    title: "Tricks & Shortcuts",
    subtitle: "Top-rated exam shortcuts from the best helpers — the fastest approaches, not textbook methods.",
  },
};

export function RouteContextBar() {
  const pathname = usePathname();
  const meta = ROUTES[pathname];

  if (!meta) return null;

  return (
    <header className="mb-8 border-border/60 border-b pb-6 md:mb-10">
      <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
        Current page
      </p>
      <h1 className="mt-1.5 font-heading text-foreground text-xl font-semibold tracking-tight md:text-2xl">
        {meta.title}
      </h1>
      <p className="mt-1.5 max-w-xl text-muted-foreground text-sm leading-relaxed">
        {meta.subtitle}
      </p>
    </header>
  );
}
