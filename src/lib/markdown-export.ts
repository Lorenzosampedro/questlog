// AI tools (Claude, Anthropic) were used throughout this project's
// development — see the "AI tools" note in README.md for scope.
import { getSchema, type JSONContent } from "@tiptap/core";
import { MarkdownSerializer } from "prosemirror-markdown";
import { journalEditorExtensions } from "@/lib/tiptap/extensions";

// Tiptap node/mark type names are camelCase ("bulletList", "codeBlock"), but
// prosemirror-markdown's own defaultMarkdownSerializer is keyed to
// prosemirror-schema-basic's snake_case names ("bullet_list", "code_block")
// — so it can't be reused directly. This serializer is built against the
// same extension list the live editor uses (journalEditorExtensions), so the
// two schemas can't silently drift apart.
const schema = getSchema(journalEditorExtensions);

const serializer = new MarkdownSerializer(
  {
    paragraph(state, node) {
      state.renderInline(node);
      state.closeBlock(node);
    },
    heading(state, node) {
      state.write(`${state.repeat("#", node.attrs.level)} `);
      state.renderInline(node);
      state.closeBlock(node);
    },
    blockquote(state, node) {
      state.wrapBlock("> ", null, node, () => state.renderContent(node));
    },
    bulletList(state, node) {
      state.renderList(node, "  ", () => "- ");
    },
    orderedList(state, node) {
      const start = (node.attrs.start as number | null) ?? 1;
      let n = start;
      state.renderList(node, "  ", () => `${n++}. `);
    },
    listItem(state, node) {
      state.renderContent(node);
    },
    codeBlock(state, node) {
      state.write("```\n");
      state.text(node.textContent, false);
      state.write("\n```");
      state.closeBlock(node);
    },
    horizontalRule(state, node) {
      state.write("---");
      state.closeBlock(node);
    },
    hardBreak(state, node, parent, index) {
      for (let i = index + 1; i < parent.childCount; i++) {
        if (parent.child(i).type !== node.type) {
          state.write("\\\n");
          return;
        }
      }
    },
    image(state, node) {
      const alt = (node.attrs.alt as string | null) ?? "";
      state.write(`![${state.esc(alt)}](${node.attrs.src})`);
    },
    // No native markdown embed for video — a plain link degrades gracefully
    // in any markdown reader, including ones (Notion) with no video-embed
    // syntax at all.
    video(state, node) {
      state.write(`[Video](${node.attrs.src})`);
      state.closeBlock(node);
    },
    text(state, node) {
      state.text(node.text ?? "");
    },
  },
  {
    bold: { open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true },
    italic: { open: "_", close: "_", mixable: true, expelEnclosingWhitespace: true },
    strike: { open: "~~", close: "~~", mixable: true, expelEnclosingWhitespace: true },
    // Not standard CommonMark, but Obsidian renders ==text== as a highlight
    // natively; other readers show it as visible literal text, which is a
    // fine degrade.
    highlight: { open: "==", close: "==", mixable: true, expelEnclosingWhitespace: true },
  },
  { hardBreakNodeName: "hardBreak" },
);

export function entryBodyToMarkdown(body: JSONContent): string {
  return serializer.serialize(schema.nodeFromJSON(body));
}

export function gameExportFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "game"}.md`;
}

type ExportGame = {
  name: string;
  platforms: string[] | null;
  genres: string[] | null;
  releaseDate: string | null;
};

type ExportEntry = {
  title: string | null;
  body: JSONContent;
  datePlayed: string | null;
  rating: number | null;
};

export function gameToMarkdown(game: ExportGame, entries: ExportEntry[]): string {
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(game.name)}`,
    `platforms: ${JSON.stringify(game.platforms ?? [])}`,
    `genres: ${JSON.stringify(game.genres ?? [])}`,
    `release_date: ${JSON.stringify(game.releaseDate)}`,
    `exported_from: "questlog"`,
    "---",
  ].join("\n");

  const sections = entries.map((entry) => {
    const meta = [
      entry.datePlayed ? `Played ${entry.datePlayed}` : null,
      entry.rating ? "★".repeat(entry.rating) + "☆".repeat(5 - entry.rating) : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" · ");

    return [
      `## ${entry.title?.trim() || "Untitled entry"}`,
      meta ? `_${meta}_` : null,
      "",
      entryBodyToMarkdown(entry.body),
    ]
      .filter((line): line is string => line !== null)
      .join("\n");
  });

  const body = sections.join("\n\n---\n\n");

  return `${frontmatter}\n\n# ${game.name}\n\n${body}\n`;
}
