"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Base UI's Checkbox.Root renders a <span> plus a visually hidden real
 * <input type="checkbox"> beside it. That's the whole point of a headless
 * primitive: we get native form semantics, keyboard handling and screen
 * reader announcements for free, and only supply the pixels.
 */
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Deliberately a stronger border than --input (oklch 0.922 on white is
        // near-invisible at 1px). An always-visible checkbox has to actually
        // read as a control at rest, not just once it's ticked.
        "flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-zinc-400 bg-background text-primary-foreground shadow-xs transition-colors outline-none dark:border-zinc-500",
        "hover:border-zinc-500 dark:hover:border-zinc-400",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-[checked]:border-primary data-[checked]:bg-primary",
        "data-[indeterminate]:border-primary data-[indeterminate]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        className={(state) =>
          cn(
            "flex items-center justify-center text-current",
            !state.checked && !state.indeterminate && "invisible",
          )
        }
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <MinusIcon className="size-3" />
            ) : (
              <CheckIcon className="size-3" />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
