"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const BRAND_GREEN = "#32cd32";

/**
 * Thin top bar (YouTube-style) during client-side navigations — brand green.
 */
export function NavigationTopLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const pendingNav = useRef(false);
  const skipFirstPath = useRef(true);
  const creepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Route finished: snap to full width, then hide.
  useEffect(() => {
    if (skipFirstPath.current) {
      skipFirstPath.current = false;
      return;
    }
    if (!pendingNav.current) return;
    pendingNav.current = false;
    if (creepRef.current) {
      clearInterval(creepRef.current);
      creepRef.current = null;
    }
    setProgress(1);
    const done = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
    return () => window.clearTimeout(done);
  }, [pathname]);

  // Ease toward ~92% while waiting for the route.
  useEffect(() => {
    if (!visible) {
      if (creepRef.current) {
        clearInterval(creepRef.current);
        creepRef.current = null;
      }
      return;
    }
    creepRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 0.92) return p;
        return Math.min(p + 0.035 + Math.random() * 0.06, 0.92);
      });
    }, 320);
    return () => {
      if (creepRef.current) {
        clearInterval(creepRef.current);
        creepRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      pendingNav.current = true;
      setVisible(true);
      setProgress(0.06);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[6000] h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className="h-full origin-left rounded-r-sm shadow-[0_0_12px_rgba(50,205,50,0.55)] transition-[transform] duration-200 ease-out"
        style={{
          transform: `scaleX(${progress})`,
          backgroundColor: BRAND_GREEN,
        }}
      />
    </div>
  );
}
