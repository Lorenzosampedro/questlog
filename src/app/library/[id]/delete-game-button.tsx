"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogPopup,
  AlertDialogPrimitive,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteGame } from "../actions";

export function DeleteGameButton({
  gameId,
  gameName,
  entryCount,
}: {
  gameId: string;
  gameName: string;
  entryCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      // deleteGame ends in redirect("/library"), which throws a special
      // NEXT_REDIRECT signal rather than returning. So this line only ever
      // resolves to a value on the failure path — on success React navigates
      // and this component unmounts.
      const result = await deleteGame(gameId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Don't let the dialog close mid-flight; the redirect is what should
        // end this interaction, not a stray Escape keypress.
        if (isPending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2Icon />
            Delete game
          </Button>
        }
      />

      <AlertDialogPrimitive.Portal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <div className="flex flex-col gap-1.5">
            <AlertDialogTitle>Delete {gameName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {entryCount === 0 ? (
                <>This removes it from your library. This cannot be undone.</>
              ) : (
                <>
                  This permanently deletes{" "}
                  <strong className="font-semibold text-foreground">
                    {entryCount} journal {entryCount === 1 ? "entry" : "entries"}
                  </strong>{" "}
                  along with any images you uploaded to them. This cannot be
                  undone.
                </>
              )}
            </AlertDialogDescription>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <AlertDialogFooter>
            {/* `render` swaps the element AlertDialog.Close renders while
                keeping its behaviour and accessibility props — the styling
                comes from our Button, the close-on-click comes from Base UI.
                Children live on the render element so nothing has to be
                merged. */}
            <AlertDialogClose
              render={
                <Button variant="outline" size="sm" disabled={isPending}>
                  Cancel
                </Button>
              }
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete forever"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialogPrimitive.Portal>
    </AlertDialog>
  );
}
