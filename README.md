# Questlog

A digital museum for your gaming life. Journal the games you play; each game
becomes a "tome" in your personal library, and the more you've written about
it, the thicker its spine renders on your shelf.

CS50x final project. See [`PLAN.md`](./PLAN.md) for the full design and
implementation plan. The CS50 writeup (distinctiveness/complexity rationale)
and demo video will be added here once the MVP is complete.

## Stack

Next.js · Supabase (Postgres/Auth/Storage) · RAWG.io · Tiptap · Tailwind CSS ·
shadcn/ui · Framer Motion

## Progress

- [x] **Phase 0** — GitHub repo
- [x] **Phase 1** — Next.js + Tailwind + shadcn/ui scaffold, Supabase project, RAWG.io key
- [x] **Phase 2** — Auth: email/password + Google/Discord OAuth (via Supabase Auth), session
      refresh + route protection (`src/proxy.ts`), protected `/library` placeholder
- [x] **Phase 3** — Database schema + RLS policies (`profiles`, `library_games`,
      `journal_entries`; see [`supabase/migrations/`](./supabase/migrations))
- [ ] **Phase 4** — Game search & library
- [ ] Phases 5-10 — see [`PLAN.md`](./PLAN.md)

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
