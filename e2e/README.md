# E2E tests

Run with `npm run test:e2e` (starts the dev server automatically).

## `public.spec.ts`

Covers everything reachable without a real login: home page branding, nav
state, the login/sign-up pages rendering, the theme toggle, and protected
routes redirecting when logged out. No setup needed.

## `core-flow.spec.ts`

Covers the authenticated core loop: sign in, add a game, write a journal
entry, confirm it's reflected on the shelf. This test creates and deletes its
own throwaway user via Supabase's admin API, which needs the **service role
key** — a secret that should never be shared outside your own environment.

To run it:

1. Get your service role key from the Supabase dashboard: **Project Settings
   → API Keys → secret key**.
2. Create `.env.test.local` in the project root (already gitignored, same
   pattern as `.env.local`):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-secret-key-here
   ```
3. Run `npm run test:e2e`.

Without `.env.test.local`, this test fails fast with a clear error rather
than hanging or silently skipping.
