import { describe, expect, it } from "vitest";
import { collectMediaPaths, storagePathFromPublicUrl } from "./journal-media";

const BASE = "https://abc123.supabase.co/storage/v1/object/public/journal-media";
const USER = "11111111-2222-3333-4444-555555555555";

describe("storagePathFromPublicUrl", () => {
  it("extracts the object path from a bucket URL", () => {
    expect(storagePathFromPublicUrl(`${BASE}/${USER}/shot.png`)).toBe(
      `${USER}/shot.png`,
    );
  });

  it("strips query strings and fragments", () => {
    expect(storagePathFromPublicUrl(`${BASE}/${USER}/shot.png?t=123`)).toBe(
      `${USER}/shot.png`,
    );
  });

  it("decodes percent-encoded segments", () => {
    expect(storagePathFromPublicUrl(`${BASE}/${USER}/boss%20fight.png`)).toBe(
      `${USER}/boss fight.png`,
    );
  });

  it("returns null for URLs outside our bucket", () => {
    expect(storagePathFromPublicUrl("https://example.com/cat.png")).toBeNull();
    expect(
      storagePathFromPublicUrl(
        "https://abc123.supabase.co/storage/v1/object/public/avatars/a.png",
      ),
    ).toBeNull();
  });

  it("returns null when there is no path after the bucket", () => {
    expect(storagePathFromPublicUrl(`${BASE}/`)).toBeNull();
  });
});

describe("collectMediaPaths", () => {
  it("finds images and videos nested anywhere in the document", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hello" }] },
        { type: "image", attrs: { src: `${BASE}/${USER}/a.png` } },
        {
          type: "blockquote",
          content: [{ type: "video", attrs: { src: `${BASE}/${USER}/b.mp4` } }],
        },
      ],
    };

    expect(collectMediaPaths(doc).sort()).toEqual([
      `${USER}/a.png`,
      `${USER}/b.mp4`,
    ]);
  });

  it("ignores externally hosted media", () => {
    const doc = {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://imgur.com/x.png" } }],
    };

    expect(collectMediaPaths(doc)).toEqual([]);
  });

  it("de-duplicates the same asset used twice", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: `${BASE}/${USER}/a.png` } },
        { type: "image", attrs: { src: `${BASE}/${USER}/a.png` } },
      ],
    };

    expect(collectMediaPaths(doc)).toEqual([`${USER}/a.png`]);
  });

  it("survives malformed documents without throwing", () => {
    expect(collectMediaPaths(null)).toEqual([]);
    expect(collectMediaPaths(undefined)).toEqual([]);
    expect(collectMediaPaths({ type: "doc" })).toEqual([]);
    expect(collectMediaPaths({ attrs: { src: 42 } })).toEqual([]);
  });
});
