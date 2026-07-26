# [App Name TBD] — a digital museum for your gaming life

CS50x final project. A private journaling web app where every game you play
becomes a "tome" in your personal library. Each journal entry you write about
a game adds to that tome; the more you've written about a game, the thicker
its spine renders on your shelf.

Status: MVP not yet started. This document is the result of a structured
planning session and should be updated as decisions change during the build.

---

## 1. Scope and constraints

- **Course**: CS50x — final project has no framework mandate, but the rubric
  requires the project be substantially more complex than a problem set, plus
  a `README.md` and a ≤3-minute demo video.
- **Timeline**: self-paced, no hard deadline. Building an MVP with the
  explicit intent to keep extending it afterward as a portfolio piece — so
  architecture decisions favor "correct enough to build on" over "fastest
  possible hack."
- **Team**: solo.
- **Visibility**: MVP is fully private (only the owning user can see their own
  library/entries). Public shareable profiles are a pinned future feature,
  not built now.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js (React)** | Unifies frontend + API layer, avoids hand-rolling a separate backend service. |
| Backend / DB / Auth / Storage | **Supabase** (Postgres, Auth, Storage) | One vendor for relational data, auth, and file storage; real SQL schema + RLS policies, not just boilerplate. |
| External game data | **RAWG.io API** | Simple API-key auth (vs. IGDB's Twitch OAuth dance); good enough coverage for cover art, platforms, release date. |
| Rich text editor | **Tiptap** (ProseMirror) | Native `Highlight` mark extension + extensible toolbar + embeddable image/video nodes — maps directly to the "highlight + format + embed media" requirement. |
| Styling | **Tailwind CSS** | Utility-first, no fighting a pre-built theme; needed for a custom museum aesthetic. |
| UI primitives | **shadcn/ui** (Radix-based) | Accessible, unstyled-but-correct components (modals, dropdowns, forms) that get fully restyled — not a generic-looking component kit. |
| Animation | **Framer Motion** | Hover-tilt on tomes, shelf entrance transitions, "pull book off shelf" open animation. |
| Hosting | **Vercel** (frontend) + **Supabase Cloud** (backend) | Zero-config pairing, free tier sufficient at this scale. |
| Testing | **Vitest** (unit) now; **Playwright** (E2E) once UI stabilizes | Cover the one genuinely tricky piece of logic (thickness scaling) first; add E2E once flows stop changing shape. |

---

## 3. Data model

```
auth.users (Supabase-managed)
  └─ profiles
       id            uuid PK, references auth.users.id
       username      text, unique          -- reserved for future public profile URLs
       display_name  text
       avatar_url    text, nullable
       created_at    timestamptz

  └─ library_games
       id            uuid PK
       user_id       uuid FK -> profiles.id
       rawg_id       integer                -- external RAWG game id
       name          text
       cover_url     text
       platforms     jsonb, nullable
       genres        jsonb, nullable
       release_date  date, nullable
       added_at      timestamptz

  └─ journal_entries
       id               uuid PK
       library_game_id  uuid FK -> library_games.id
       user_id          uuid FK -> profiles.id   -- denormalized for simpler RLS
       title            text, nullable
       body             jsonb                     -- Tiptap/ProseMirror document JSON
       date_played      date, nullable            -- optional, defaults to created date
       rating           smallint, nullable (1-5)   -- optional
       created_at       timestamptz
       updated_at       timestamptz
```

Notes:
- **No separate `media` table for MVP.** Images/videos are embedded directly
  as nodes inside the Tiptap `body` JSON, pointing at Supabase Storage URLs
  under a per-user path (`{user_id}/{entry_id}/{filename}`). This avoids a
  join for something that's fundamentally part of the document. Tradeoff:
  cleaning up orphaned storage files on entry delete needs explicit handling
  (delete referenced files when an entry is deleted), not automatic
  cascading — revisit if this becomes painful.
- **Entry count per game** is computed via a query/aggregate (`count(*)`
  grouped by `library_game_id`), not stored as a denormalized counter, to
  avoid sync bugs. Revisit with a materialized view or trigger-maintained
  counter only if this becomes a real performance issue.
- **RLS**: every table has row-level security enabled, policies scoped to
  `auth.uid() = user_id`. Storage bucket policies scoped to the same
  per-user path prefix. Nothing is public in MVP.
- **`profiles` rows are auto-created** by an `on_auth_user_created` trigger on
  `auth.users` (implemented in
  [`supabase/migrations/20260726000000_init_schema.sql`](./supabase/migrations/20260726000000_init_schema.sql)),
  so `library_games`/`journal_entries` can safely FK to `profiles.id` without
  the app ever inserting a profile row itself.
- **`library_games` has a `unique (user_id, rawg_id)` constraint** — a user
  can't add the same RAWG game to their library twice.

### Pinned for later (not built now, schema should not preclude them)
- `hours_played` (numeric) and `completion_status` (enum) on `journal_entries`
  or `library_games`.
- `visibility` flag (`private` / `public`) on `library_games` and/or
  `profiles`, plus a public read-only route (`/u/[username]`), to enable
  shareable museum profiles.
- Stats/"wrapped" view once `date_played`/hours data exists in volume.

---

## 4. The signature feature: the tome shelf

- Each `library_game` renders as a book "tome" — cover art wrapped onto a
  spine, laid out across a shelf grid.
- **Pseudo-3D rendering**: CSS 3D transforms (`perspective`, `rotateY`) plus
  layered box-shadows for page-edge depth and gradient overlays for lighting
  — not a WebGL/3D-engine approach. Built as the actual MVP visual, not
  deferred.
- **Spine thickness** is a function of that game's journal entry count, using
  a **capped, logarithmic scale** so growth is noticeable early (1→5 entries)
  but tapers off instead of producing absurdly fat or paper-thin spines:

  ```
  spineWidth = clamp(
    minWidth + k * log(1 + entryCount),
    minWidth,
    maxWidth
  )
  ```

  Exact `minWidth`/`maxWidth`/`k` values to be tuned visually once real data
  exists — flag this as a unit-testable pure function (`getSpineWidth(entryCount)`)
  since it's the one piece of genuinely non-trivial logic in the shelf.

- Clicking a tome opens its "book" page — a per-game view listing that game's
  journal entries (chapters/pages within the book), where entries are
  created/edited/read.
- Interactions (hover-tilt, click-to-open transition) handled with Framer
  Motion.

---

## 5. Feature scope

### MVP (build now)
- Auth: email/password + Google OAuth + Discord OAuth via Supabase Auth.
- Game search (RAWG.io) → add game to personal library.
- Tome shelf: pseudo-3D spine rendering, capped log-scale thickness.
- Per-game page listing journal entries.
- Journal entry CRUD: Tiptap rich text (highlight + formatting toolbar),
  optional embedded images/videos (Supabase Storage), optional date-played,
  optional 1–5 rating.
- Fully private to the logged-in user.
- Responsive layout (shelf + editor both usable on mobile).
- Vitest unit tests for the thickness-scaling function and any non-trivial
  data transforms.
- Deployed to Vercel + Supabase Cloud.
- README.md + demo video for CS50 submission.

### Pinned for later (explicitly deferred, not in MVP)
- Public/shareable profile pages (`visibility` flag + public route).
- `hours_played` / `completion_status` fields.
- Stats/"wrapped" view.
- Full 3D (WebGL/Three.js) shelf upgrade.
- Cloudinary migration for media transforms/thumbnails, if Supabase Storage
  proves limiting.
- IGDB swap, if RAWG's data quality becomes a real limitation.
- Playwright E2E test suite once core flows stabilize.
- Social features (following other users, browsing public shelves).

---

## 6. Build order (phases)

1. **Project setup** — `create-next-app`, Tailwind + shadcn/ui init, Supabase
   project (dev + prod), RAWG API key, env vars, repo structure.
2. **Auth** — Supabase Auth wiring (email/password, Google, Discord OAuth
   apps + redirect URLs), protected route layout, basic nav shell.
3. **Schema + RLS** — create tables above as Supabase migrations, write and
   test RLS policies before any UI depends on them.
4. **Game search & library** — RAWG search integration, "add to library"
   flow, fetch/display a user's `library_games`.
5. **Tome shelf UI** — shelf grid layout, `getSpineWidth()` function (+ first
   Vitest tests), pseudo-3D CSS spine rendering, hover interactions.
6. **Per-game page** — route for a single tome, lists its journal entries.
7. **Journal entry CRUD** — Tiptap integration (highlight mark + toolbar),
   image/video embed uploading to Supabase Storage, optional
   date-played/rating fields, create/edit/delete flows.
8. **Polish pass** — empty states, loading states, responsive/mobile pass,
   accessibility check on shadcn/ui components + custom shelf interactions.
9. **Testing** — fill out Vitest coverage; add Playwright for the core flow
   (sign up → add game → create entry → see it reflected on the shelf).
10. **CS50 deliverables** — write README.md (incl. distinctiveness/complexity
    rationale), record demo video, confirm production deploy on Vercel.

### After MVP ships
Revisit the "pinned for later" list in Section 5 — public profiles first
(smallest schema change, biggest portfolio-shareability payoff), then
hours/completion fields, then stats view.

---

## 7. Open items
- App name/branding — not yet decided, doesn't block architecture.
- Exact `minWidth`/`maxWidth`/`k` constants for spine thickness — tune
  visually once the shelf is rendering real data.
