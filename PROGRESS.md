# Phase 0 MVP — Autonomous Execution Log

**Started:** 2026-04-21 (overnight run)
**Plan:** `docs/plans/2026-04-21-schoolsout-phase-0-mvp.md`
**Operator:** Claude Opus 4.7, subagent-driven execution

Legend: ✅ done · ⏭️ skipped (reason) · ❌ failed (error) · ⏳ in progress

## Task status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Scaffold Next.js + TypeScript + Tailwind | ✅ | Next.js 14.2.35; scaffolded via temp subdir to avoid create-next-app conflict checks; renamed package to `schoolsout-app` |
| 2 | Install runtime + dev dependencies | ✅ | Vitest 4.1.5 config added; `pnpm test` exits 0 with `--passWithNoTests` |
| 3 | Configure Tailwind design tokens | ✅ | Tailwind v3.4.1 (classic `tailwind.config.ts` route); Plus Jakarta Sans via `next/font/google`; scrubbed scaffold CSS overrides |
| 4 | `.env.example` + env loader | ⏳ | |
| 5 | Initialize Supabase locally | ⏳ | |
| 6 | Write initial schema migration | ⏳ | |
| 7 | Seed Noah's school + closures | ⏳ | |
| 8 | Supabase client helpers (browser + server + service) | ⏳ | |
| 9 | Auth-session middleware | ⏳ | |
| 10 | `next-intl` with `[locale]` routing | ⏳ | |
| 11 | Phase 0 message catalogs (EN + ES) | ⏳ | |
| 12 | LanguageToggle component | ⏳ | |
| 13 | Countdown utility + badge | ⏳ | |
| 14 | ClosureCard component | ⏳ | |
| 15 | Closures query + types | ⏳ | |
| 16 | Home page | ⏳ | |
| 17 | ReminderSignup component | ⏳ | |
| 18 | `/api/reminders/subscribe` route | ⏳ | |
| 19 | Confirm + unsubscribe routes | ⏳ | |
| 20 | Bilingual React Email reminder template | ⏳ | |
| 21 | `/api/cron/send-reminders` | ⏳ | |
| 22 | Resend webhook handler | ⏳ | |
| 23 | Privacy policy + ToS placeholder pages | ⏳ | |
| 24 | Vercel Cron config | ⏳ | |
| 25 | Link Supabase project + deploy to Vercel | ⏳ | Expected to partially skip — requires human login |
| 26 | Final Phase 0 verification | ⏳ | |

## Build checkpoints

| After task | `npm run build` result |
|------------|------------------------|
| 5          | — |
| 10         | — |
| 15         | — |
| 20         | — |
| 25         | — |
| Final      | — |

## Decisions log

Any `// DECISION:` comments added by implementers will be summarized here at the end.

### Task 1
- **Scaffold approach**: `create-next-app` refuses to run when the target directory contains unexpected files (even with `--yes`). Rather than deleting/stashing tracked files out-of-repo, ran the generator inside a temporary `scaffold-tmp/` subdirectory, then moved its output up to the repo root. Pre-existing files (`PROGRESS.md`, `SCHOOLSOUT-*.md`, `docs/`) were left untouched.
- **Package name**: renamed `package.json` `name` from the temp-dir-derived `scaffold-tmp` to `schoolsout-app`.
- **Next.js version**: pinned to 14.x per plan (`create-next-app@14` resolved to 14.2.35).

### Task 2
- **`--passWithNoTests` added up front**: plan said to add the flag only if the default `vitest run` didn't exit 0 for an empty suite. Vitest 4.x still exits 0 with a "No test files found" message by default, but adding the flag up front is harmless, self-documents intent, and makes the script resilient to future Vitest major versions that flip the default. Script is `vitest run --passWithNoTests`.
- **Resolved versions installed**: `@supabase/supabase-js` 2.104.0, `@supabase/ssr` 0.10.2, `resend` 6.12.2, `react-email` 6.0.0, `@react-email/components` 1.0.12, `next-intl` 4.9.1, `zod` 4.3.6, `@anthropic-ai/sdk` 0.90.0; dev: `vitest` 4.1.5, `@vitejs/plugin-react` 6.0.1, `@testing-library/react` 16.3.2, `@testing-library/jest-dom` 6.9.1, `jsdom` 29.0.2, `supabase` (CLI) 2.93.0, `@types/node` bumped.
- **Ignored build scripts warning (pnpm)**: pnpm blocked postinstall scripts for `@parcel/watcher`, `@swc/core`, `esbuild`, `supabase`, `unrs-resolver`. Left as-is — none are required for `pnpm test` to pass. The `supabase` CLI binary wasn't placed in `node_modules/.bin` because its postinstall was skipped; Task 5 (which needs the CLI) will either run `pnpm approve-builds supabase` or use a globally-installed Supabase CLI. Not blocking Task 2.
- **`@react-email/components` deprecation warning**: pnpm flags the package as deprecated. Left the plan's pinned choice in place since `react-email` 6 is the current runtime; the warning is upstream messaging and does not affect functionality.

### Task 3
- **Tailwind version**: v3.4.1 is installed (per Task 2), so used the plan's default `tailwind.config.ts` extension strategy. Did NOT need the v4 `@theme`-in-CSS fallback.
- **Content glob simplified**: narrowed to `./src/**/*.{ts,tsx}` per the plan spec (replaces the scaffolded three-entry glob). Everything we author lives under `src/`.
- **Default `borderRadius.2xl` override**: Tailwind's default `rounded-2xl` is `1rem` already; the explicit entry is preserved per the plan so the token is discoverable in the config file (no behavior change).
- **Font strategy**: replaced scaffolded `localFont` (Geist Sans + Mono from `src/app/fonts/`) with `Plus_Jakarta_Sans` via `next/font/google`, exposed as `--font-jakarta` and wired to `font-display`. Kept the `metadata` export (updated title/description to School's Out copy) — dropped Geist imports per plan. The `src/app/fonts/` dir and its `.woff` files are now orphaned but harmless; leaving for Task 26 cleanup.
- **`globals.css` scrub**: removed the scaffold's `:root` light/dark custom properties and the `body { color/background/font-family }` ruleset, since those would otherwise override the `bg-gradient-to-br … text-white font-display` classes applied in `layout.tsx`. Kept the `@tailwind` directives and the `.text-balance` utility. The old `background`/`foreground` colors in `tailwind.config.ts` (which referenced the removed CSS vars) are gone as part of the full replacement.
- **`page.tsx` left untouched**: the scaffolded home page still references `var(--font-geist-sans)` / `var(--font-geist-mono)` in `font-[family-name:…]` utilities. Those variables no longer exist, so the browser silently falls back — this is not a compile error and Task 16 will replace `page.tsx` wholesale anyway.
- **Build**: `pnpm run build` succeeded — compiled, typed, and statically rendered all pages.

## Final summary

(Written at the end of the run.)
