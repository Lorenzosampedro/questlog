export const TOME_MIN_DEPTH = 40;
export const TOME_MAX_DEPTH = 140;
const GROWTH_RATE = 24;

/**
 * Capped log-scale spine thickness: noticeable growth for the first few
 * entries, tapering off so no tome can blow past TOME_MAX_DEPTH.
 */
export function getSpineDepth(entryCount: number): number {
  const raw = TOME_MIN_DEPTH + GROWTH_RATE * Math.log(1 + Math.max(0, entryCount));
  return Math.min(TOME_MAX_DEPTH, Math.max(TOME_MIN_DEPTH, raw));
}
