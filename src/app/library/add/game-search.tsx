"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addGameToLibrary } from "@/app/library/actions";
import type { RawgGameSummary } from "@/lib/rawg";

export function GameSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RawgGameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const controller = new AbortController();

    async function search() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/rawg/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(search, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function handleAdd(game: RawgGameSummary) {
    startTransition(async () => {
      const result = await addGameToLibrary(game);
      if (result?.success) {
        setAddedIds((prev) => new Set(prev).add(game.rawgId));
      }
    });
  }

  const displayedResults = query.trim() ? results : [];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Input
        type="search"
        placeholder="Search for a game..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {loading && <p className="text-sm text-zinc-500">Searching...</p>}

      <ul className="flex flex-col gap-3">
        {displayedResults.map((game) => {
          const added = addedIds.has(game.rawgId);
          return (
            <li
              key={game.rawgId}
              className="flex items-center gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
                {game.coverUrl && (
                  <Image
                    src={game.coverUrl}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{game.name}</p>
                <p className="text-sm text-zinc-500">
                  {game.releaseDate?.slice(0, 4) ?? "Unknown year"} ·{" "}
                  {game.platforms.slice(0, 3).join(", ") || "Unknown platform"}
                </p>
              </div>
              <Button
                type="button"
                variant={added ? "secondary" : "default"}
                size="sm"
                disabled={added || isPending}
                onClick={() => handleAdd(game)}
              >
                {added ? "Added" : "Add"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
