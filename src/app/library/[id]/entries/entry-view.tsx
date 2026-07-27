"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Video } from "@/lib/tiptap/video";

export function EntryView({ body }: { body: JSONContent }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [StarterKit, Highlight, Image, Video],
    content: body,
    editorProps: {
      attributes: {
        class: "prose prose-zinc dark:prose-invert max-w-none focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
