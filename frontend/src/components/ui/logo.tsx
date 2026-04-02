import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-[15px]",
    md: "text-[17px]",
    lg: "text-2xl",
  };

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-extrabold tracking-tight select-none",
        sizeClasses[size],
        className,
      )}
    >
      <span className="text-[#32cd32]">People</span>
      <span className="text-foreground">solve</span>
      <span className="text-[#ff4444]">.</span>
    </span>
  );
}
