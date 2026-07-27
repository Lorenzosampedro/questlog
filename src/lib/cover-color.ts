import "server-only";
import sharp from "sharp";

/**
 * Average color of an image, sampled by downscaling to a single pixel.
 * Used to tint a tome's spine to match its cover art. Returns null on any
 * failure (unreachable URL, unsupported format) — callers should treat a
 * missing spine color as a normal, non-fatal case.
 */
export async function getAverageColor(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const { data } = await sharp(buffer)
      .resize(1, 1)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const [r, g, b] = data;
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return null;
  }
}
