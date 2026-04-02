"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ICON_STROKE } from "@/lib/icon-style";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(
        "border-border/90 bg-background/95 shadow-sm backdrop-blur-md",
        "hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
        className,
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {!mounted ? (
        <span className="size-4" aria-hidden />
      ) : isDark ? (
        <Sun className="size-4 text-amber-400" strokeWidth={ICON_STROKE} />
      ) : (
        <Moon className="size-4 text-[#32cd32]" strokeWidth={ICON_STROKE} />
      )}
    </Button>
  );
}
