"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { ICON_STROKE } from "@/lib/icon-style";
import { cn } from "@/lib/utils";

const triggerClass = cn(
  "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm text-foreground outline-none transition-[color,box-shadow,border-color]",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "dark:border-white/12 dark:bg-input/30",
  "data-[popup-open]:border-primary/55 data-[popup-open]:shadow-[0_0_0_2px_rgba(50,205,50,0.22)]",
);

const popupClass = cn(
  "max-h-[min(22rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-xl border p-1 shadow-xl outline-none",
  "border-border bg-popover text-popover-foreground",
  "dark:border-white/12 dark:bg-[oklch(0.11_0.012_145)] dark:text-foreground",
  "shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(50,205,50,0.12)]",
);

const itemClass = cn(
  "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none",
  "text-foreground",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
  "data-[highlighted]:bg-primary/20 data-[highlighted]:text-foreground",
  "data-[selected]:bg-primary/12 data-[selected]:font-medium",
);

export type FormSelectProps = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  "aria-label"?: string;
};

/**
 * Theme-aware select: replaces native `<select>` so the list uses popover colors (fixes white OS dropdown in dark mode).
 */
export function FormSelect({
  id,
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (next != null) onValueChange(String(next));
      }}
    >
      <Select.Trigger id={id} className={triggerClass} aria-label={ariaLabel}>
        <Select.Value />
        <Select.Icon className="pointer-events-none shrink-0 text-muted-foreground">
          <ChevronDown className="size-4" strokeWidth={ICON_STROKE} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="z-[300] outline-none"
          sideOffset={6}
          alignItemWithTrigger={false}
        >
          <Select.Popup className={popupClass}>
            <Select.List className="outline-none">
              {options.map((opt) => (
                <Select.Item key={opt} value={opt} className={itemClass}>
                  <Select.ItemText>{opt}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center text-primary">
                    <Check className="size-3.5" strokeWidth={ICON_STROKE} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
