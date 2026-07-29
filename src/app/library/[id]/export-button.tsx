"use client";

import { useState, useTransition } from "react";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportGameMarkdown } from "../actions";

export function ExportButton({ gameId }: { gameId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportGameMarkdown(gameId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);

      const blob = new Blob([result.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
        <DownloadIcon />
        {isPending ? "Exporting…" : "Export as Markdown"}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
