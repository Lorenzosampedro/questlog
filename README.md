# Questlog

A digital museum for your gaming life. Journal the games you play; each game
becomes a "tome" in your personal library, and the more you've written about
it, the thicker its spine renders on your shelf.

CS50x final project. See [`PLAN.md`](./PLAN.md) for the full design doc.

## CS50 submission

**Demo video:** https://youtube.com/shorts/f7l7Dvnvupw?feature=share

**AI tools:** Built with substantial assistance from Claude (Anthropic),
used throughout development — planning and architecture, implementation,
debugging, and refactoring — as permitted under CS50's final-project AI
policy ([cs50.harvard.edu/x/project](https://cs50.harvard.edu/x/project/)).
The essence of the design decisions, product direction, and review of every
change is my own; a few representative source files carry a short comment
pointing back to this note.

### Distinctiveness and complexity

Questlog isn't a CRUD form wearing a theme — the two hardest problems in the
app are things CS50's problem sets never touch:

- **The tome shelf is a real rendering algorithm, not a static layout.**
  Each game's spine thickness is driven by `getSpineDepth()`
  ([`src/lib/tome.ts`](./src/lib/tome.ts)), a capped logarithmic function of
  that game's journal entry count, so growth is visible early but never
  produces a spine that swallows the shelf. The books themselves are
  composed as true 3D objects — six independently transformed faces
  (`preserve-3d`, per-face `rotateY`/`translateZ`, sized and positioned so
  they meet exactly at the spine edge) rendered with CSS alone, no
  WebGL/Three.js. Getting the face composition right required working out
  the transform-matrix math by hand (rotate each face around its own center,
  then translate it out along Z by half the book's own depth), not
  copy-pasting a tutorial snippet.
- **Auth and data access are handled at the database layer, not just the UI
  layer.** Sign-in supports email/password plus two OAuth providers (Google,
  Discord) through Supabase Auth, with SSR cookie-based sessions
  (`@supabase/ssr`) and a `proxy.ts` gate on every protected route. But the
  real enforcement is Postgres Row-Level Security: every table's policies
  are scoped to `auth.uid() = user_id`, so even a bug in the Next.js route
  handlers couldn't leak one user's library or journal entries to another —
  the database refuses the query, not just the UI.
- **Integrating three independent, non-trivial subsystems into one flow.**
  A game added via the RAWG.io API becomes a shelf tome whose thickness
  reacts live to entries written in a Tiptap (ProseMirror) rich-text editor
  with a custom formatting/highlight toolbar and inline image uploads to
  Supabase Storage, scoped per-user by storage path. None of these are
  simple to wire up individually (RAWG's inconsistent nested platform/genre
  shapes needed their own mapping layer; Tiptap's server-side HTML
  generation doesn't work at all — it needs a real DOM — which forced a
  client-side read-only render for the view page); getting all three to
  agree on one data model (a `library_game` owning many `journal_entries`,
  entry count driving spine width, entry body driving storage cleanup on
  delete) is where the actual complexity lives.
- **The shelf is arrangeable, and keeping that consistent is a distributed-
  state problem.** Books can be dragged into any order the user likes
  (`@dnd-kit`), which meant solving three separate problems. Postgres: "set a
  different value on each of N rows" can't be expressed through Supabase's
  auto-generated REST API — an upsert becomes an `INSERT ... ON CONFLICT` and
  trips over the NOT NULL columns — so reordering goes through a custom SQL
  function using `unnest(ids) with ordinality` to renumber the whole shelf in
  one atomic statement, declared `security invoker` so RLS still applies.
  React: the new order has to appear instantly but must not survive a failed
  write, which is what React 19's `useOptimistic` gives — on error it stops
  overriding and the shelf snaps back to server truth, with no manual rollback
  path that could drift. CSS: the dragged book has to render in a portal,
  because each tome lives inside a `perspective` container and a transformed
  ancestor re-bases `position: fixed`, making an in-place drag drift away from
  the cursor.
- **Destructive operations that span two storage systems.** Deleting a game
  cascades to its journal entries in Postgres, but embedded screenshots are
  Supabase Storage objects with no foreign key pointing at them — no cascade
  reaches them. Cleanup walks each entry's ProseMirror document for media
  nodes, filters out externally hosted URLs so the app never deletes something
  it doesn't own, then removes the blobs *after* the rows. Since no
  transaction spans Postgres and Storage, the ordering is chosen for its
  failure mode: a failed blob delete leaves invisible orphaned files, whereas
  the reverse order would leave visibly broken images under live entries.
- **Automated test coverage across both layers.** Vitest covers the pure
  logic (spine-thickness scaling, RAWG response mapping, Storage path
  extraction from ProseMirror documents) and Playwright
  drives a real browser through the full authenticated flow — sign in,
  search RAWG, add a game, write an entry, and verify the shelf reflects it
  — using Supabase's admin API to provision and tear down a throwaway test
  user per run.

Distinct from prior CS50 work in another sense too: nothing in the course
covers CSS 3D transform composition, Postgres RLS policy design, OAuth
provider setup against real third-party developer consoles (Google Cloud
Console, Discord Developer Portal), or a ProseMirror-based rich text editor
— all of which had to be learned and integrated from scratch for this
project.

## Stack

Next.js · Supabase (Postgres/Auth/Storage) · RAWG.io · Tiptap · Tailwind CSS ·
shadcn/ui · Base UI · Motion · dnd-kit

## Project structure

**`src/app/`** — routes (Next.js App Router):
- `auth/` — login, sign-up, OAuth callback, email confirmation; `actions.ts`
  holds the server actions (`signInWithOAuth`, `signInWithPassword`, `signUp`).
- `library/` — the shelf (`page.tsx`), a single game's page
  (`[id]/page.tsx`), and entry CRUD nested under `[id]/entries/`. Each level
  has its own `actions.ts` for that level's mutations (a game's own actions —
  add/reorder/delete/export — live in `library/actions.ts`; an entry's
  create/update/delete live in `library/[id]/entries/actions.ts`).
- `library/[id]/entries/entry-editor.tsx` + `entry-toolbar.tsx` — the Tiptap
  rich-text editor and its formatting/image/video toolbar.
- `library/[id]/export-button.tsx` — calls the markdown-export server action
  and downloads the result as a `.md` file.
- `api/rawg/search/route.ts` — a Route Handler (not a Server Action) wrapping
  the RAWG search, so the game-search UI can call it with a debounced `fetch`.
- `layout.tsx`, `page.tsx`, `not-found.tsx` — root shell, landing page, 404.

**`src/components/`**:
- `tome.tsx`, `tome-shelf.tsx`, `sortable-tome.tsx` — the 3D book rendering
  and the drag-to-reorder shelf.
- `nav.tsx`, `theme-toggle.tsx`, `page-transition.tsx`, `star-rating.tsx` —
  shared chrome.
- `ui/` — shadcn/ui-style primitives wrapping Base UI (button, input, label,
  checkbox, separator, alert-dialog).

**`src/lib/`** — the actual logic, most of it covered by the Vitest suite:
- `tome.ts` — `getSpineDepth()`, the capped log-scale spine-thickness curve.
- `rawg.ts` / `rawg-mapper.ts` — the RAWG.io API client and the mapper that
  normalizes its inconsistent response shapes.
- `journal-media.ts` — walks a Tiptap document to find Storage-hosted media,
  used by delete-cleanup so orphaned blobs don't pile up.
- `markdown-export.ts` — converts a Tiptap document, and a game's full entry
  list, into portable markdown (with YAML frontmatter) for the "Export as
  Markdown" feature.
- `storage.ts` — uploads journal images/video to Supabase Storage.
- `cover-color.ts` — extracts a game cover's average color for the tome's
  spine tint.
- `auth.ts` — `getUser()`, cached per-request via React's `cache()`.
- `supabase/client.ts` vs. `supabase/server.ts` — the browser vs. server
  Supabase client split (cookie-based sessions differ between the two).
- `tiptap/` — the shared editor extension list (`extensions.ts`, reused by
  both the live editor and the markdown exporter so their schemas can't
  drift apart) and the custom `Video` node.

**`src/proxy.ts`** — runs before every request; refreshes the Supabase
session and redirects logged-out requests away from `/library/**`.

**`supabase/migrations/`** — hand-applied SQL migrations, run in filename
order: base schema + RLS policies, the journal-media Storage bucket, the
spine-color column, and the shelf's `sort_order` column plus its reorder
function.

**`e2e/`** and **`*.test.ts`** — Playwright specs (`public.spec.ts`,
`core-flow.spec.ts`) drive a real browser through the authenticated flow;
`*.test.ts` files sit next to their subject in `src/lib/` and cover the
pure-logic pieces (spine depth, RAWG mapping, media-path extraction,
markdown export).

## Getting started

Requires **Node.js 22+**.

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + RAWG.io keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Auth setup (Supabase dashboard)

1. **Authentication → URL Configuration** — add `http://localhost:3000/**` to Redirect URLs.
2. **Authentication → Providers → Google** and **Discord** — enable each and add OAuth client
   credentials from their respective developer consoles, using
   `https://<your-project-ref>.supabase.co/auth/v1/callback` as the redirect URI on both.

### Database (Supabase dashboard)

Schema lives in [`supabase/migrations/`](./supabase/migrations) for version control, but is
applied by hand via the Supabase dashboard's **SQL Editor** (copy the migration file's contents
in, run it) rather than `supabase db push`, since that command needs the database password.
Run migrations in filename order when setting up a new project.

## Testing

```bash
npm run test        # Vitest — pure logic (spine thickness scaling, RAWG data
                    #   mapping, journal media path extraction)
npm run test:e2e    # Playwright — see e2e/README.md for the authenticated-flow setup
```
