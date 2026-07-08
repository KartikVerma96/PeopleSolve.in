"use client";

import { IncomingCallProvider } from "@/components/call/incoming-call-provider";
import { GlobalErrorHandler } from "@/components/providers/error-boundary";
import { NavigationTopLoader } from "@/components/layout/navigation-top-loader";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/providers/session-provider";
import { SessionToReduxSync } from "@/components/providers/session-to-redux-sync";
import { SocketProvider } from "@/components/providers/socket-provider";
import { StoreProvider } from "@/components/providers/store-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

/**
 * Global client providers: Redux, persistence, NextAuth, tooltips.
 * Order: outer → inner = Store → Session → Tooltip (tooltips need DOM).
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <GlobalErrorHandler />
      <StoreProvider>
        <SessionProvider>
          <SessionToReduxSync />
          <SocketProvider />
          <IncomingCallProvider />
          <ToastProvider>
            <TooltipProvider delay={200}>
              <NavigationTopLoader />
              {children}
            </TooltipProvider>
          </ToastProvider>
        </SessionProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
