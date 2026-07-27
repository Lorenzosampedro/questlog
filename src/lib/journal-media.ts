export const JOURNAL_MEDIA_BUCKET = "journal-media";

const PUBLIC_URL_MARKER = `/storage/v1/object/public/${JOURNAL_MEDIA_BUCKET}/`;

/**
 * Turn a Supabase public Storage URL back into the object path the Storage
 * API expects.
 *
 *   https://xyz.supabase.co/storage/v1/object/public/journal-media/<uid>/a.png
 *   →  "<uid>/a.png"
 *
 * Returns null for anything that isn't one of our own bucket URLs — a user can
 * paste an external image into an entry, and we must never try to delete
 * something we don't own.
 */
export function storagePathFromPublicUrl(url: string): string | null {
  const markerIndex = url.indexOf(PUBLIC_URL_MARKER);
  if (markerIndex === -1) return null;

  const path = url.slice(markerIndex + PUBLIC_URL_MARKER.length);
  // Strip any query string / fragment Supabase or the browser may have added.
  const clean = path.split(/[?#]/)[0];
  if (!clean) return null;

  return decodeURIComponent(clean);
}

/**
 * Walk a Tiptap/ProseMirror document and collect the Storage paths of every
 * image and video it embeds.
 *
 * The walk is deliberately structure-agnostic: it looks for any node with an
 * `attrs.src`, rather than checking `type === "image" | "video"`. Adding a new
 * media node type later (audio, embeds) then needs no change here. The
 * `storagePathFromPublicUrl` filter is what keeps it safe — non-bucket URLs
 * drop out.
 */
export function collectMediaPaths(doc: unknown): string[] {
  const paths = new Set<string>();

  function walk(node: unknown): void {
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    if (typeof node !== "object" || node === null) return;

    const record = node as Record<string, unknown>;

    const attrs = record.attrs;
    if (typeof attrs === "object" && attrs !== null) {
      const src = (attrs as Record<string, unknown>).src;
      if (typeof src === "string") {
        const path = storagePathFromPublicUrl(src);
        if (path) paths.add(path);
      }
    }

    if (record.content) walk(record.content);
  }

  walk(doc);
  return [...paths];
}
