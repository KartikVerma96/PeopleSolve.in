"use client";

import { cn } from "@/lib/utils";

type LogoLoaderProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Branded loader: "Peoplesolve." text that fills with green color left-to-right
 * using a CSS clip-path animation.
 */
export function LogoLoader({ className, size = "md" }: LogoLoaderProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-2", className)}
      role="status"
      aria-label="Loading"
    >
      <div className="relative select-none">
        {/* Base text — muted/ghost */}
        <span
          className={cn(
            "font-extrabold tracking-tight text-muted-foreground/20 dark:text-white/10",
            sizeClasses[size],
          )}
          aria-hidden
        >
          People<span className="text-muted-foreground/20 dark:text-white/10">solve</span>
          <span className="text-muted-foreground/20 dark:text-white/10">.</span>
        </span>

        {/* Colored overlay — clips left to right repeatedly */}
        <span
          className={cn(
            "absolute inset-0 font-extrabold tracking-tight",
            "animate-logo-fill",
            sizeClasses[size],
          )}
          aria-hidden
        >
          <span className="text-[#32cd32]">People</span>
          <span className="text-foreground">solve</span>
          <span className="text-[#ff4444]">.</span>
        </span>
      </div>
    </div>
  );
}
