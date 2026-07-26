"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { getSpineDepth } from "@/lib/tome";

const TOME_WIDTH = 140;
const TOME_HEIGHT = 200;

type TomeProps = {
  id: string;
  name: string;
  coverUrl: string | null;
  entryCount: number;
};

export function Tome({ id, name, coverUrl, entryCount }: TomeProps) {
  const depth = getSpineDepth(entryCount);

  return (
    <Link
      href={`/library/${id}`}
      className="shrink-0 focus-visible:outline-none"
      style={{ perspective: 900 }}
      aria-label={`${name} — ${entryCount} ${entryCount === 1 ? "entry" : "entries"}`}
    >
      <motion.div
        className="relative rounded-[3px] focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          width: TOME_WIDTH,
          height: TOME_HEIGHT,
          transformStyle: "preserve-3d",
        }}
        initial={{ rotateY: -22 }}
        whileHover={{ rotateY: 0, y: -10, scale: 1.05 }}
        whileFocus={{ rotateY: 0, y: -10, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        {/* spine / depth edge — rotated around its own center then pushed out
            by half its depth, so it recedes from the front cover's right
            edge back into the screen rather than swinging in front of it */}
        <div
          className="absolute inset-y-0 right-0 bg-gradient-to-b from-zinc-300 via-zinc-100 to-zinc-400 dark:from-zinc-600 dark:via-zinc-500 dark:to-zinc-700"
          style={{
            width: depth,
            transform: `rotateY(90deg) translateZ(${depth / 2}px)`,
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6">
            <p className="line-clamp-2 text-xs font-medium text-white">{name}</p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
