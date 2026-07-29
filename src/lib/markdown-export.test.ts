import { describe, expect, it } from "vitest";
import { entryBodyToMarkdown, gameExportFilename, gameToMarkdown } from "./markdown-export";

function doc(...content: object[]) {
  return { type: "doc", content };
}

function paragraph(...content: object[]) {
  return { type: "paragraph", content };
}

function text(value: string, marks?: object[]) {
  return marks ? { type: "text", text: value, marks } : { type: "text", text: value };
}

describe("entryBodyToMarkdown", () => {
  it("renders a plain paragraph", () => {
    expect(entryBodyToMarkdown(doc(paragraph(text("Just beat the final boss."))))).toBe(
      "Just beat the final boss.",
    );
  });

  it("renders bold and italic marks", () => {
    const body = doc(
      paragraph(text("That fight was "), text("brutal", [{ type: "bold" }]), text(" and "), text("long", [{ type: "italic" }]), text(".")),
    );
    expect(entryBodyToMarkdown(body)).toBe("That fight was **brutal** and _long_.");
  });

  it("renders a highlight mark as ==text==", () => {
    const body = doc(paragraph(text("important", [{ type: "highlight" }])));
    expect(entryBodyToMarkdown(body)).toBe("==important==");
  });

  it("renders headings at the right level", () => {
    const body = doc({ type: "heading", attrs: { level: 2 }, content: [text("Boss Fight")] });
    expect(entryBodyToMarkdown(body)).toBe("## Boss Fight");
  });

  it("renders a bullet list", () => {
    const body = doc({
      type: "bulletList",
      content: [
        { type: "listItem", content: [paragraph(text("Item one"))] },
        { type: "listItem", content: [paragraph(text("Item two"))] },
      ],
    });
    expect(entryBodyToMarkdown(body)).toBe("- Item one\n\n- Item two");
  });

  it("renders an image node", () => {
    const body = doc({ type: "image", attrs: { src: "https://x.supabase.co/a.png", alt: null } });
    expect(entryBodyToMarkdown(body)).toBe("![](https://x.supabase.co/a.png)");
  });

  it("renders the custom video node as a plain link", () => {
    const body = doc({ type: "video", attrs: { src: "https://x.supabase.co/clip.mp4" } });
    expect(entryBodyToMarkdown(body)).toBe("[Video](https://x.supabase.co/clip.mp4)");
  });
});

describe("gameExportFilename", () => {
  it("slugifies the game name", () => {
    expect(gameExportFilename("Hollow Knight: Silksong")).toBe("hollow-knight-silksong.md");
  });

  it("falls back to 'game' if nothing alphanumeric survives", () => {
    expect(gameExportFilename("???")).toBe("game.md");
  });
});

describe("gameToMarkdown", () => {
  const game = {
    name: "Hollow Knight",
    platforms: ["PC", "Switch"],
    genres: ["Metroidvania"],
    releaseDate: "2017-02-24",
  };

  it("includes YAML frontmatter describing the game", () => {
    const md = gameToMarkdown(game, []);
    expect(md).toContain('title: "Hollow Knight"');
    expect(md).toContain('platforms: ["PC","Switch"]');
    expect(md).toContain('genres: ["Metroidvania"]');
    expect(md).toContain('release_date: "2017-02-24"');
    expect(md.startsWith("---\n")).toBe(true);
  });

  it("renders each entry as a heading with date/rating and separates entries with a rule", () => {
    const md = gameToMarkdown(game, [
      {
        title: "First steps",
        body: doc(paragraph(text("Started in Dirtmouth."))),
        datePlayed: "2026-01-01",
        rating: 4,
      },
      {
        title: null,
        body: doc(paragraph(text("No title this time."))),
        datePlayed: null,
        rating: null,
      },
    ]);

    expect(md).toContain("## First steps");
    expect(md).toContain("_Played 2026-01-01 · ★★★★☆_");
    expect(md).toContain("Started in Dirtmouth.");
    expect(md).toContain("## Untitled entry");
    expect(md).toContain("No title this time.");
    expect(md).toContain("\n\n---\n\n");
  });
});
