"use client";

import type { KeyboardEventHandler } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { GripVerticalIcon } from "lucide-react";
import { Tome } from "@/components/tome";
import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export type SortableTomeProps = {
  id: string;
  name: string;
  coverUrl: string | null;
  entryCount: number;
  spineColor: string | null;
  disabled?: boolean;
};

export function SortableTome({
  id,
  name,
  coverUrl,
  entryCount,
  spineColor,
  disabled,
}: SortableTomeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <li
      ref={setNodeRef}
      // dnd-kit animates the *gap-filling* motion of the non-dragged items by
      // writing a transform here. It has to own this element's transform
      // outright, which is why the entrance animation lives on an inner
      // motion.div — two libraries writing the same CSS property fight, and
      // motion wins the last write.
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex justify-center touch-none",
        // While dragging, this is just the hole the book came out of — the
        // book itself is being rendered by the DragOverlay, above everything.
        isDragging && "opacity-30",
      )}
      {...listeners}
    >
      <motion.div variants={itemVariants} className="relative">
        <Tome
          id={id}
          name={name}
          coverUrl={coverUrl}
          entryCount={entryCount}
          spineColor={spineColor}
          isDragging={isDragging}
        />

        {/* The pointer sensor lets you grab the book anywhere. This handle
            exists for the keyboard sensor, which needs a focusable element to
            receive the Space/Arrow keys — and it's the only visible signal
            that the shelf is rearrangeable at all. */}
        {!disabled && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reorder ${name}`}
            className="absolute -top-1 -right-1 z-10 grid size-6 cursor-grab place-items-center rounded-full border border-border bg-background text-zinc-500 opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing group-hover/shelf:opacity-100"
            {...attributes}
            // Only the key handler, not the whole listener map. The pointer
            // listeners already live on the <li>; spreading them here too
            // would fire activation twice for a single pointerdown, since the
            // button's event bubbles straight up into its own parent.
            // dnd-kit types its listener map loosely as Record<string,
            // Function>, so the cast is annotating what we already know rather
            // than papering over a mismatch.
            onKeyDown={
              listeners?.onKeyDown as
                | KeyboardEventHandler<HTMLButtonElement>
                | undefined
            }
          >
            <GripVerticalIcon className="size-3.5" />
          </button>
        )}
      </motion.div>
    </li>
  );
}
