"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Couldn&apos;t load your library
      </h1>
      <p className="max-w-sm text-zinc-500">{error.message}</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
