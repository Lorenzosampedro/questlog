"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Video } from "@/lib/tiptap/video";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { EntryToolbar } from "./entry-toolbar";
import { createEntry, updateEntry, deleteEntry } from "./actions";

type EntryEditorProps = {
  gameId: string;
  userId: string;
  entryId?: string;
  initialTitle?: string | null;
  initialBody?: JSONContent | null;
  initialDatePlayed?: string | null;
  initialRating?: number | null;
};

export function EntryEditor({
  gameId,
  userId,
  entryId,
  initialTitle = "",
  initialBody = null,
  initialDatePlayed = null,
  initialRating = null,
}: EntryEditorProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [datePlayed, setDatePlayed] = useState(initialDatePlayed ?? "");
  const [rating, setRating] = useState<number | null>(initialRating);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Highlight, Image, Video],
    content: initialBody ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none min-h-[300px] rounded-b-lg border border-t-0 border-zinc-200 p-4 focus:outline-none dark:border-zinc-800",
      },
    },
  });

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    setError(null);

    const input = {
      title: title.trim() || null,
      body: editor.getJSON(),
      datePlayed: datePlayed || null,
      rating,
    };

    const result = entryId
      ? await updateEntry(entryId, gameId, input)
      : await createEntry(gameId, input);

    setSaving(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  async function handleDelete() {
    if (!entryId) return;
    if (!window.confirm("Delete this entry? This can't be undone.")) return;
    const result = await deleteEntry(entryId, gameId);
    if (result?.error) {
      setError(result.error);
    }
  }

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled entry"
        />
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date-played">Date played</Label>
          <Input
            id="date-played"
            type="date"
            value={datePlayed}
            onChange={(e) => setDatePlayed(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Rating</Label>
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      <div className="flex flex-col">
        <EntryToolbar editor={editor} userId={userId} />
        <EditorContent editor={editor} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {entryId && (
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete entry
          </Button>
        )}
      </div>
    </div>
  );
}
