"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { getSpineDepth } from "@/lib/tome";
import { cn } from "@/lib/utils";

const TOME_WIDTH = 140;
const TOME_HEIGHT = 200;

type TomeProps = {
  id: string;
  name: string;
  coverUrl: string | null;
  entryCount: number;
  spineColor: string | null;
};

export function Tome({ id, name, coverUrl, entryCount, spineColor }: TomeProps) {
  const depth = getSpineDepth(entryCount);
  const [isFocused, setIsFocused] = useState(false);

  const spineBackground = spineColor
    ? `linear-gradient(to bottom, color-mix(in oklab, ${spineColor} 65%, white), ${spineColor}, color-mix(in oklab, ${spineColor} 70%, black))`
    : undefined;

  return (
    <Link
      href={`/library/${id}`}
      className="group flex shrink-0 flex-col items-center gap-3 focus-visible:outline-none"
      aria-label={`${name} — ${entryCount} ${entryCount === 1 ? "entry" : "entries"}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div style={{ perspective: 900 }}>
        <motion.div
          className="relative rounded-[3px] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2"
          style={{
            width: TOME_WIDTH,
            height: TOME_HEIGHT,
            transformStyle: "preserve-3d",
          }}
          animate={
            isFocused
              ? { rotateY: 0, y: -10, scale: 1.05 }
              : { rotateY: -22, y: 0, scale: 1 }
          }
          whileHover={{ rotateY: 0, y: -10, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          {/* spine / depth edge — rotated around its own center then pushed out
              by half its depth, so it recedes from the front cover's right
              edge back into the screen rather than swinging in front of it.
              Colored from the cover art's average color when available. */}
          <div
            className={cn(
              "absolute inset-y-0 right-0",
              !spineColor &&
                "bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-400 dark:from-zinc-600 dark:via-zinc-500 dark:to-zinc-700",
            )}
            style={{
              width: depth,
              transform: `rotateY(90deg) translateZ(${depth / 2}px)`,
              background: spineBackground,
            }}
          />

          {/* front cover — pushed forward by half the depth so it meets the
              spine edge exactly at the box's front-right seam */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[3px] bg-zinc-800 shadow-[4px_10px_18px_rgba(0,0,0,0.35)]"
            style={{ transform: `translateZ(${depth / 2}px)` }}
          >
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt=""
                fill
                sizes="140px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-zinc-700 p-2 text-center text-xs text-zinc-300">
                {name}
              </div>
            )}
            {/* subtle top-down lighting */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/50" />
          </div>
        </motion.div>
      </div>

      {/* museum plaque */}
      <div className="w-[130px] rounded-sm border border-amber-900/15 bg-amber-50/90 px-2 py-1.5 text-center shadow-sm dark:border-amber-100/10 dark:bg-zinc-900/80">
        <p className="truncate font-serif text-[11px] tracking-wide text-amber-950/80 dark:text-amber-100/70">
          {name}
        </p>
      </div>
    </Link>
  );
}
