# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

The project pins a Next.js version newer than your training data (currently
16.2.12). Concretely: this app uses `src/proxy.ts`, not `middleware.ts` — the
`proxy()` export/config convention replaced middleware in this version. Don't
"fix" it back to `middleware.ts`. When in doubt about any other API, check
`node_modules/next/dist/docs/` before assuming Next 13/14 conventions.

## Commands

```bash
npm run dev          # dev server (http://localhost:3000)
npm run build
npm run lint

npm run test          # vitest run — pure-logic unit tests (src/**/*.test.ts)
npm run test:watch    # vitest watch mode
npx vitest run src/lib/tome.test.ts   # single test file

npm run test:e2e      # playwright — starts the dev server automatically
npx playwright test e2e/public.spec.ts   # single e2e spec
```

`test:e2e` runs two specs: `e2e/public.spec.ts` (no setup needed — logged-out
flows only) and `e2e/core-flow.spec.ts` (authenticated core loop; requires
`SUPABASE_SERVICE_ROLE_KEY` in a gitignored `.env.test.local` — see
[`e2e/README.md`](./e2e/README.md)). Without that key, `core-flow.spec.ts`
fails fast with an explicit error rather than hanging.

Database schema changes go in `supabase/migrations/` for version control, but
are applied by hand through the Supabase dashboard's SQL Editor (not
`supabase db push`, which needs the DB password not otherwise stored). Run
migration files in filename order.

## Architecture

Next.js App Router + Supabase (Postgres/Auth/Storage), with RAWG.io as the
external game-data source and Tiptap (ProseMirror) as the rich-text engine.
Full rationale for these choices lives in [`PLAN.md`](./PLAN.md).

**Data model** (`supabase/migrations/20260726000000_init_schema.sql`):
`profiles` (auto-created via an `on_auth_user_created` trigger on
`auth.users` — the app never inserts a profile row itself) →
`library_games` (one row per game a user added from RAWG, unique on
`(user_id, rawg_id)`) → `journal_entries` (many per game; `body` is a
Tiptap/ProseMirror JSON document, `user_id` is denormalized onto the entry
for simpler RLS). Entry count per game is computed with a `count(*)` query,
not a denormalized counter. Images/videos embedded in an entry are Tiptap
nodes pointing at Supabase Storage URLs — there's no separate media table.

**Security is enforced at the database, not the route layer.** Every table
has RLS policies scoped to `auth.uid() = user_id`; Storage bucket paths are
scoped per-user (`{user_id}/...`). `src/proxy.ts` also gates `/library/**`
by redirecting logged-out requests to `/auth/login`, but that's a UX
convenience — the actual data isolation guarantee comes from Postgres, so a
bug in a route handler can't leak another user's rows.

**Supabase client split**: `src/lib/supabase/client.ts` (browser,
`createBrowserClient`) vs `src/lib/supabase/server.ts` (Server
Components/Actions, cookie-based session via `next/headers`,
`createServerClient`). Use whichever matches where the calling code runs —
mixing them up breaks session refresh. `src/lib/auth.ts` wraps
`getUser()` in React's `cache()` for per-request de-duping in Server
Components.

**RAWG integration**: `src/lib/rawg.ts` calls the RAWG API server-side only
(`RAWG_API_KEY` is never exposed to the browser) and maps responses through
`src/lib/rawg-mapper.ts` (`mapRawgGame`), which normalizes RAWG's
inconsistent nested `platforms`/`genres` shapes into flat string arrays —
this mapper is the thing covered by `rawg-mapper.test.ts`.

**The tome shelf** (`src/components/tome-shelf.tsx`, `tome.tsx`): each
library game renders as a "book" whose spine thickness is
`getSpineDepth(entryCount)` (`src/lib/tome.ts`) — a capped logarithmic curve
between `TOME_MIN_DEPTH`/`TOME_MAX_DEPTH`, tested in `tome.test.ts`. Books
are real 3D objects built from six independently transformed CSS faces
(`preserve-3d`, per-face `rotateY`/`translateZ`) rather than a flat sprite,
with no WebGL/Three.js involved.

**Journal editor**: `src/app/library/[id]/entries/entry-editor.tsx` +
`entry-toolbar.tsx` wrap Tiptap with a `Highlight` mark and a custom
video node (`src/lib/tiptap/video.ts`); image uploads go through
`src/lib/storage.ts` (`uploadJournalMedia`) to the `journal-media` Storage
bucket. Tiptap's server-side HTML generation doesn't work (it needs a real
DOM), which is why `entry-view.tsx` renders read-only entries client-side
instead of on the server.

**Route structure**: `src/app/library/[id]/` is a single tome's page;
`src/app/library/[id]/entries/` holds entry CRUD (`new/`,
`[entryId]/`, `[entryId]/edit/`), with server actions in `actions.ts` at
each level (`library/actions.ts` for library-level mutations,
`library/[id]/entries/actions.ts` for entry-level ones). Auth routes
(`login`, `sign-up`, OAuth `callback`, email `confirm`) live under
`src/app/auth/`.

**Testing split**: Vitest covers pure logic only (spine-depth scaling, RAWG
mapping) — no component/DOM tests. Playwright covers real authenticated
browser flows, provisioning and tearing down a throwaway Supabase user per
run via the admin API.
