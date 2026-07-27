"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { motion } from "motion/react";
import { Tome } from "@/components/tome";
import { SortableTome } from "@/components/sortable-tome";
import { reorderLibrary } from "@/app/library/actions";

export type ShelfGame = {
  id: string;
  name: string;
  coverUrl: string | null;
  entryCount: number;
  spineColor: string | null;
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

export function TomeShelf({ games }: { games: ShelfGame[] }) {
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // useOptimistic gives us the reordered shelf *immediately* on drop, then
  // hands control back to the server's version once the action's transition
  // settles. The important part is what it does on failure: it doesn't
  // "roll back" so much as stop overriding — the value simply reverts to
  // `games`, which is still the un-reordered server data. No manual undo, no
  // stale-state bug where the UI and DB silently disagree.
  const [optimisticGames, applyOptimisticOrder] = useOptimistic(games);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Without a distance threshold, every click on a book would be
      // interpreted as the start of a drag and the <Link> would never fire.
      // 8px is the conventional "did they mean to move it?" line.
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeGame = optimisticGames.find((game) => game.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setError(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = optimisticGames.findIndex((g) => g.id === active.id);
    const newIndex = optimisticGames.findIndex((g) => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(optimisticGames, oldIndex, newIndex);

    startTransition(async () => {
      // Must be called inside the transition — that's the scope React uses to
      // decide how long the optimistic value stays applied.
      applyOptimisticOrder(reordered);

      const result = await reorderLibrary(reordered.map((g) => g.id));
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between px-1">
        <p className="text-xs text-zinc-500">Drag to rearrange your shelf.</p>
        {isPending && <p className="text-xs text-zinc-500">Saving…</p>}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            Couldn&apos;t save order: {error}
          </p>
        )}
      </div>

      <DndContext
        id={dndId}
        sensors={sensors}
        // closestCenter beats the default rectangle-intersection for a grid:
        // books are tall and narrow with wide gaps, so a dragged book often
        // overlaps nothing at all, and intersection-based detection just
        // gives up. Comparing centre points always yields a target.
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext
          items={optimisticGames.map((game) => game.id)}
          strategy={rectSortingStrategy}
        >
          <div className="group/shelf rounded-2xl bg-gradient-to-b from-amber-900/5 via-amber-900/5 to-amber-950/10 p-8 dark:from-amber-950/20 dark:via-amber-950/10 dark:to-black/40">
            <motion.ul
              className="grid gap-x-6 gap-y-14"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              }}
              initial="hidden"
              animate="visible"
              variants={listVariants}
            >
              {optimisticGames.map((game) => (
                <SortableTome key={game.id} {...game} />
              ))}
            </motion.ul>
          </div>
        </SortableContext>

        {/* DragOverlay renders the dragged book in a portal at the document
            root. That's not cosmetic: each Tome sits inside a `perspective`
            container with `preserve-3d` faces, and a CSS transform on an
            ancestor re-bases `position: fixed` for everything under it. In
            place, the dragged book would drift away from the cursor. */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeGame ? (
            <div className="rotate-3 cursor-grabbing opacity-95 drop-shadow-2xl">
              <Tome {...activeGame} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
