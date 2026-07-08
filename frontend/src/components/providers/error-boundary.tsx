"use client";

import { useEffect } from "react";

/**
 * Catches unhandled errors and rejections that would otherwise crash the app.
 * Specifically handles [object Event] errors from WebSocket/script failures.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      // Suppress WebSocket/script Event errors that aren't real app crashes
      if (e.error instanceof Event || String(e.message) === "[object Event]") {
        e.preventDefault();
        console.warn("[ErrorHandler] suppressed Event error:", e.message);
        return;
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      // Suppress Event-type rejections (socket connection failures etc.)
      if (e.reason instanceof Event || String(e.reason) === "[object Event]") {
        e.preventDefault();
        console.warn("[ErrorHandler] suppressed unhandled rejection:", e.reason);
        return;
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
