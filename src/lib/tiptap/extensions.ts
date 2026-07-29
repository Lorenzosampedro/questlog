import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Video } from "@/lib/tiptap/video";

// Shared between the live editor (entry-editor.tsx) and the markdown
// exporter (markdown-export.ts), which builds its schema from this same
// list — keeping one source of truth means the two can't silently diverge
// if a node type is ever added.
export const journalEditorExtensions = [StarterKit, Highlight, Image, Video];
