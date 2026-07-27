"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? null : n)}
          className="text-zinc-300 transition-colors hover:text-amber-400 dark:text-zinc-700"
        >
          <Star
            className={cn(
              "size-5",
              value !== null && n <= value && "fill-amber-400 text-amber-400",
            )}
          />
        </button>
      ))}
    </div>
  );
}
