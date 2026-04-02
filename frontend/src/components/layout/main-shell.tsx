"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RouteContextBar } from "@/components/layout/route-context-bar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ICON_STROKE } from "@/lib/icon-style";
import { cn } from "@/lib/utils";

type MainShellProps = {
  children: React.ReactNode;
};

/**
 * Shell: layered glows (Raycast / fde-style depth) + glass header on mobile.
 */
export function MainShell({ children }: MainShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop: top-right of viewport; mobile uses header row below */}
      <div className="pointer-events-none fixed top-4 right-[max(1rem,env(safe-area-inset-right))] z-[100] hidden md:pointer-events-auto md:block">
        <ThemeToggle />
      </div>

      {/* Ambient orbs — subtle, not noisy */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(50,205,50,0.12),transparent_55%)] opacity-40 dark:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_100%_20%,rgba(50,205,50,0.05),transparent_50%)] opacity-40 dark:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_0%_80%,rgba(20,83,45,0.08),transparent_45%)] opacity-40 dark:opacity-100"
        aria-hidden
      />

      <aside className="hidden shrink-0 md:flex md:h-full">
        <AppSidebar className="h-full min-h-0" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex h-14 shrink-0 items-center gap-3 border-border/80 border-b bg-background/85 pr-[max(1rem,env(safe-area-inset-right))] pl-4 shadow-sm backdrop-blur-xl md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0 border-border bg-card shadow-sm dark:border-white/10 dark:bg-white/5"
                  aria-label="Open menu"
                />
              }
            >
              <PanelLeft className="size-4" strokeWidth={ICON_STROKE} />
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100%,280px)] border-white/10 bg-sidebar/95 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <AppSidebar className="h-full w-full border-0" forceExpanded />
            </SheetContent>
          </Sheet>
          <span className="min-w-0 flex-1">
            <Logo size="sm" />
          </span>
          <ThemeToggle />
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key="main"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative min-h-0 flex-1 overflow-y-auto",
              "bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(50,205,50,0.06),transparent_50%)]",
            )}
          >
            <div className="relative mx-auto w-full max-w-6xl px-5 py-5 sm:px-8 md:px-10 md:py-6 lg:px-12">
              <RouteContextBar />
              {children}
            </div>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
