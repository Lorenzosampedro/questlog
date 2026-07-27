"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { deleteEntries } from "./entries/actions";

export type EntrySummary = {
  id: string;
  title: string | null;
  datePlayed: string | null;
  createdAt: string;
  rating: number | null;
};

export function EntryList({
  gameId,
  entries,
}: {
  gameId: string;
  entries: EntrySummary[];
}) {
  // A Set, not an array: membership checks and toggles are what this state is
  // for, and we do one per row on every render.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useTransition is what makes the Server Action non-blocking. `isPending`
  // stays true not just while the POST is in flight but until React has
  // re-rendered with the fresh server data, so rows can't flicker back.
  const [isPending, startTransition] = useTransition();

  const allSelected = selected.size === entries.length && entries.length > 0;
  const hasSelection = selected.size > 0;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      // Never mutate the Set in place — React compares by reference, so an
      // in-place `prev.add()` would be the same object and skip the re-render.
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirming(false);
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)));
    setConfirming(false);
  }

  function clearSelection() {
    setSelected(new Set());
    setConfirming(false);
    setError(null);
  }

  function handleDelete() {
    const ids = [...selected];
    startTransition(async () => {
      const result = await deleteEntries(ids, gameId);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      clearSelection();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header row. The select-all checkbox sits in the same 16px column as
          every row's checkbox, so the controls line up vertically. */}
      <div className="flex min-h-9 items-center gap-3 px-3">
        <Checkbox
          checked={allSelected}
          indeterminate={hasSelection && !allSelected}
          onCheckedChange={toggleAll}
          disabled={isPending}
          aria-label={allSelected ? "Deselect all entries" : "Select all entries"}
        />

        <div className="flex flex-1 items-center justify-between gap-3">
          <span
            className={cn(
              "text-sm",
              hasSelection
                ? "font-medium text-foreground"
                : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            {hasSelection
              ? `${selected.size} selected`
              : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </span>

          {/* The destructive controls only exist once something is selected,
              so the resting state of the page stays uncluttered. */}
          {hasSelection &&
            (confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Delete {selected.size}{" "}
                  {selected.size === 1 ? "entry" : "entries"}?
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirming(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirming(true)}
                >
                  Delete {selected.size}
                </Button>
              </div>
            ))}
        </div>
      </div>

      {error && (
        <p className="px-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => {
          const isSelected = selected.has(entry.id);

          return (
            <li
              key={entry.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-zinc-200 px-3 transition-colors dark:border-zinc-800",
                isSelected
                  ? "border-primary/50 bg-primary/5"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                isPending && isSelected && "opacity-50",
              )}
            >
              {/* The checkbox is a sibling of the link, never a child of it:
                  an interactive control nested inside an <a> is invalid HTML
                  and a screen-reader trap. Two separate targets in one row —
                  tick to select, click the text to open. */}
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggle(entry.id)}
                disabled={isPending}
                aria-label={`Select ${entry.title || "Untitled entry"}`}
              />

              <Link
                href={`/library/${gameId}/entries/${entry.id}`}
                className="flex flex-1 flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">
                  {entry.title || "Untitled entry"}
                </span>
                <span className="text-sm text-zinc-500">
                  {(entry.datePlayed ?? entry.createdAt).slice(0, 10)}
                  {entry.rating ? ` · ${entry.rating}★` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
