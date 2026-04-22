# School's Out! Phase 0 MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the 2-week dumb MVP — anonymous home page showing next 3 closures for 1 school, bilingual EN/ES toggle, email-only reminder signup, and a daily cron that actually sends reminders 14/7/3 days before each closure.

**Architecture:** Next.js 14 App Router with `[locale]` route segment for i18n. Supabase Postgres for DB and magic-link auth. Resend for bilingual transactional + recurring reminder emails. Vercel Cron triggers a daily send-reminders route. Kid profile data is **client-side only** (localStorage) — never sent to server. No passwords, no onboarding, no camps, no AI, no operator flow. Those are Phase 2+.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Postgres + Auth + CLI), `@supabase/ssr`, Resend, React Email, `next-intl`, Zod, Vitest (unit tests), Playwright (deferred to Phase 1), Vercel (hosting + Cron).

**Related docs:** `SCHOOLSOUT-PRD_1.md` (v3.1 spec), `docs/plans/2026-04-21-schoolsout-v3.1-design.md` (decisions), `SCHOOLSOUT-CLAUDE-CODE-GUIDE.md` (human-facing build guide).

**Conventions for this plan:**
- Use @superpowers:test-driven-development for every task with a natural test surface.
- Commit after each task. Messages: conventional commits (`feat:`, `chore:`, `test:`).
- Run all commands from the project root `/Users/rasheidscarlett/Projects/schoolsout-app` unless noted.
- Stack decision: `pnpm` (faster installs, strict deps). If unavailable, `npm` works everywhere `pnpm` is mentioned.

---

## Task 1: Scaffold Next.js + TypeScript + Tailwind

**Files:**
- Create: project scaffold in current repo root

**Step 1: Run `create-next-app`**

```bash
pnpm dlx create-next-app@14 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm \
  --no-git
```

When prompted about merging into the existing repo, answer **Yes**. Keep existing `SCHOOLSOUT-*.md` files intact.

**Step 2: Verify scaffold**

```bash
ls src/app && pnpm dev
```

Expected: `layout.tsx  page.tsx  globals.css`, dev server on `http://localhost:3000`. Stop the server.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 app with TypeScript + Tailwind"
```

---

## Task 2: Install runtime + dev dependencies

**Files:** `package.json`

**Step 1: Install runtime deps**

```bash
pnpm add \
  @supabase/supabase-js @supabase/ssr \
  resend react-email @react-email/components \
  next-intl \
  zod \
  @anthropic-ai/sdk
```

**Step 2: Install dev deps**

```bash
pnpm add -D \
  vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom \
  supabase \
  @types/node
```

**Step 3: Verify Vitest runs**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Add to `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Run: `pnpm test`

Expected: "No test files found" (exit 0) — Vitest is wired.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts vitest.setup.ts
git commit -m "chore: install Supabase, Resend, next-intl, Vitest deps"
```

---

## Task 3: Configure Tailwind design tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Extend Tailwind config**

Replace `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'purple-deep': '#1a0b2e',
        'purple-mid':  '#2d1b4e',
        'blue-deep':   '#0b1d3a',
        'cta-yellow':  '#facc15',
        'success':     '#10b981',
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Wire Plus Jakarta Sans in `src/app/layout.tsx`**

Replace the top of `src/app/layout.tsx` with:

```tsx
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white font-display">
        {children}
      </body>
    </html>
  );
}
```

**Step 3: Verify in browser**

```bash
pnpm dev
```

Open `http://localhost:3000`. Expect dark purple gradient background + Plus Jakarta Sans rendering. Stop server.

**Step 4: Commit**

```bash
git add tailwind.config.ts src/app/layout.tsx src/app/globals.css
git commit -m "feat: apply School's Out design tokens and Plus Jakarta Sans"
```

---

## Task 4: Create `.env.example` + env loader

**Files:**
- Create: `.env.example`
- Create: `src/lib/env.ts`
- Create: `tests/lib/env.test.ts`

**Step 1: Write failing test**

`tests/lib/env.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('env', () => {
  beforeEach(() => { vi.resetModules(); });

  it('throws on missing required var', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    await expect(import('@/lib/env')).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('returns parsed env when all present', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://x.supabase.co');
  });
});
```

**Step 2: Run — expect fail (module not found)**

```bash
pnpm test tests/lib/env.test.ts
```

Expected: FAIL, "Cannot find module '@/lib/env'".

**Step 3: Write `src/lib/env.ts`**

```ts
import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  APP_URL: z.string().url(),
});

export const env = schema.parse(process.env);
```

**Step 4: Write `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
RESEND_API_KEY=re_YOUR_KEY
CRON_SECRET=a_long_random_string_used_by_vercel_cron
APP_URL=http://localhost:3000
```

**Step 5: Add `.env.local` to `.gitignore`** (Next.js scaffold already does this — verify).

```bash
grep -q "^.env.local$" .gitignore || echo ".env.local" >> .gitignore
```

**Step 6: Run tests — expect pass**

```bash
pnpm test tests/lib/env.test.ts
```

Expected: 2 passed.

**Step 7: Commit**

```bash
git add src/lib/env.ts tests/lib/env.test.ts .env.example .gitignore
git commit -m "feat: typed env loader with zod validation"
```

---

## Task 5: Initialize Supabase locally

**Files:**
- Create: `supabase/config.toml` (generated)
- Modify: `.gitignore`

**Step 1: Init Supabase**

```bash
pnpm exec supabase init
```

Answer "No" to VSCode settings generation.

**Step 2: Add Supabase artifacts to `.gitignore`**

Append:

```
supabase/.branches/
supabase/.temp/
```

**Step 3: Start local Supabase stack**

```bash
pnpm exec supabase start
```

Expected: output includes `API URL`, `DB URL`, `Studio URL`, `anon key`, `service_role key`. This takes ~30s first time (Docker pulls).

Copy the local credentials into `.env.local`:

```bash
cp .env.example .env.local
# manually edit .env.local with the printed values
```

**Step 4: Commit**

```bash
git add supabase/config.toml .gitignore
git commit -m "chore: init local Supabase stack"
```

---

## Task 6: Write initial schema migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `tests/db/schema.test.ts`

**Step 1: Write the migration**

`supabase/migrations/001_initial_schema.sql`:

```sql
-- School's Out! v3.1 — Phase 0 schema.
-- No `kids` table: kid profile data is client-side only per COPPA design.

create type user_role as enum ('parent', 'operator', 'admin');
create type language_code as enum ('en', 'es');
create type school_type as enum ('public', 'private', 'charter');
create type closure_status as enum ('ai_draft', 'verified', 'rejected');
create type age_range as enum ('4-6', '7-9', 'all');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  preferred_language language_code not null default 'en',
  zip_code text,
  role user_role not null default 'parent',
  coppa_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  district text not null,
  city text not null,
  state text not null,
  type school_type not null,
  calendar_source_url text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.closures (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  emoji text not null default '📅',
  status closure_status not null default 'ai_draft',
  source text not null default 'manual',
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index closures_school_date_status_idx
  on public.closures (school_id, start_date, status);

create table public.reminder_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  age_range age_range not null default 'all',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, school_id)
);
create index reminder_subs_school_idx
  on public.reminder_subscriptions (school_id) where enabled = true;

create table public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.reminder_subscriptions(id) on delete cascade,
  closure_id uuid not null references public.closures(id) on delete cascade,
  days_before int not null check (days_before in (3, 7, 14)),
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  unique (subscription_id, closure_id, days_before)
);
create index reminder_sends_sent_at_idx on public.reminder_sends (sent_at);

-- RLS
alter table public.users                  enable row level security;
alter table public.schools                enable row level security;
alter table public.closures               enable row level security;
alter table public.reminder_subscriptions enable row level security;
alter table public.reminder_sends         enable row level security;

-- Anonymous reads for schools + verified closures (public content).
create policy "anyone can read schools"
  on public.schools for select using (true);

create policy "anyone can read verified closures"
  on public.closures for select using (status = 'verified');

-- Authenticated users can read their own row.
create policy "users can read self"
  on public.users for select using (auth.uid() = id);

-- Authenticated users manage their own reminder subscriptions.
create policy "users manage own subscriptions"
  on public.reminder_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reminder sends are read by owner only; writes happen server-side via service role.
create policy "users read own sends"
  on public.reminder_sends for select
  using (exists (
    select 1 from public.reminder_subscriptions rs
    where rs.id = reminder_sends.subscription_id and rs.user_id = auth.uid()
  ));

-- Trigger: create public.users row when a new auth.users is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, coppa_consent_at)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'coppa_consent_at')::timestamptz, now())
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Step 2: Write a smoke test**

`tests/db/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const skip = !url || !key;

describe.skipIf(skip)('schema', () => {
  const db = createClient(url, key);

  it('has closures table with status enum', async () => {
    const { error } = await db.from('closures').select('id, status').limit(1);
    expect(error).toBeNull();
  });

  it('has reminder_subscriptions table', async () => {
    const { error } = await db.from('reminder_subscriptions').select('id').limit(1);
    expect(error).toBeNull();
  });

  it('has reminder_sends table', async () => {
    const { error } = await db.from('reminder_sends').select('id').limit(1);
    expect(error).toBeNull();
  });
});
```

**Step 3: Apply the migration locally**

```bash
pnpm exec supabase db reset
```

Expected: "Finished supabase db reset on branch main."

**Step 4: Run the smoke test**

```bash
pnpm test tests/db/schema.test.ts
```

Expected: 3 passed (provided `.env.local` has the local Supabase creds loaded — Vitest loads `.env` via dotenv; if not, prefix `pnpm` with `dotenv -e .env.local --`).

**Step 5: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql tests/db/schema.test.ts
git commit -m "feat(db): initial v3.1 schema with RLS and auth.users trigger"
```

---

## Task 7: Seed Noah's school + closures

**Files:**
- Create: `supabase/seed.sql`

**Step 1: Write the seed**

`supabase/seed.sql`:

```sql
-- 1 school (Noah's, placeholder — update with the real school name/district)
insert into public.schools (id, name, district, city, state, type)
values (
  '00000000-0000-0000-0000-000000000001',
  'The Growing Place',
  'Miami-Dade Private',
  'Coral Gables',
  'FL',
  'private'
) on conflict (id) do nothing;

-- Verified closures for 2026 school year — adjust dates to the real calendar.
insert into public.closures (school_id, name, start_date, end_date, emoji, status, source) values
  ('00000000-0000-0000-0000-000000000001', 'Memorial Day',           '2026-05-25', '2026-05-25', '🇺🇸', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Summer Break',           '2026-06-08', '2026-08-16', '☀️', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Labor Day',              '2026-09-07', '2026-09-07', '🛠️', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Thanksgiving Break',     '2026-11-25', '2026-11-27', '🦃', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Winter Break',           '2026-12-21', '2027-01-02', '❄️', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Martin Luther King Day', '2027-01-18', '2027-01-18', '✊🏿', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Presidents Day',         '2027-02-15', '2027-02-15', '🎩', 'verified', 'manual'),
  ('00000000-0000-0000-0000-000000000001', 'Spring Break',           '2027-03-22', '2027-03-26', '🌸', 'verified', 'manual')
on conflict do nothing;
```

**Step 2: Reset DB and apply seed**

```bash
pnpm exec supabase db reset
```

The reset applies migrations and runs `seed.sql` automatically.

**Step 3: Verify row counts**

```bash
pnpm exec supabase db execute "select (select count(*) from schools) as schools, (select count(*) from closures) as closures"
```

Expected: `schools=1, closures=8`.

**Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): seed 1 school and 8 verified closures"
```

---

## Task 8: Supabase client helpers (browser + server)

**Files:**
- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/service.ts`
- Create: `tests/lib/supabase.test.ts`

**Step 1: Write tests**

`tests/lib/supabase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('supabase clients', () => {
  it('browser client is a function', async () => {
    const { createBrowserSupabase } = await import('@/lib/supabase/browser');
    expect(typeof createBrowserSupabase).toBe('function');
  });

  it('service client uses service role', async () => {
    const { createServiceSupabase } = await import('@/lib/supabase/service');
    const client = createServiceSupabase();
    expect(client).toBeTruthy();
  });
});
```

**Step 2: Run — expect fail.**

```bash
pnpm test tests/lib/supabase.test.ts
```

**Step 3: Write `src/lib/supabase/browser.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createBrowserSupabase() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

**Step 4: Write `src/lib/supabase/server.ts`**

```ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export function createServerSupabase() {
  const store = cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (name) => store.get(name)?.value,
      set: (name, value, options: CookieOptions) => {
        try { store.set({ name, value, ...options }); } catch { /* route handlers may be readonly */ }
      },
      remove: (name, options: CookieOptions) => {
        try { store.set({ name, value: '', ...options }); } catch { /* noop */ }
      },
    },
  });
}
```

**Step 5: Write `src/lib/supabase/service.ts`**

```ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Service role client. NEVER import from client components.
export function createServiceSupabase() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
```

**Step 6: Run tests — expect pass.**

```bash
pnpm test tests/lib/supabase.test.ts
```

**Step 7: Commit**

```bash
git add src/lib/supabase tests/lib/supabase.test.ts
git commit -m "feat: browser, server, and service-role Supabase clients"
```

---

## Task 9: Auth-session middleware

**Files:**
- Create: `src/middleware.ts`

**Step 1: Write middleware**

`src/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
      },
    },
  );

  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

**Step 2: Verify dev server still boots**

```bash
pnpm dev
```

Load `/`, stop the server.

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: Supabase session-refresh middleware"
```

---

## Task 10: `next-intl` with `[locale]` routing

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/i18n/request.ts`
- Modify: `next.config.js` → `next.config.ts`
- Create: `src/middleware.ts` (extended — merge with Task 9 output)
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- Move: `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`

**Step 1: Install the plugin**

Already installed in Task 2. Verify `next-intl` in `package.json`.

**Step 2: Create `src/i18n/config.ts`**

```ts
export const locales = ['en', 'es'] as const;
export const defaultLocale = 'en' as const;
export type Locale = (typeof locales)[number];
```

**Step 3: Create `src/i18n/request.ts`**

```ts
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();
  return { messages: (await import(`./messages/${locale}.json`)).default };
});
```

**Step 4: Replace `next.config.ts`**

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  experimental: { typedRoutes: true },
};

export default withNextIntl(config);
```

(Delete `next.config.js` if it exists.)

**Step 5: Extend middleware with locale routing**

Replace `src/middleware.ts`:

```ts
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';
import { locales, defaultLocale } from '@/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localeDetection: true,
});

export async function middleware(req: NextRequest) {
  const intlRes = intlMiddleware(req);
  const res = intlRes instanceof NextResponse ? intlRes : NextResponse.next();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => res.cookies.set({ name, value, ...options }),
        remove: (name, options) => res.cookies.set({ name, value: '', ...options }),
      },
    },
  );
  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

**Step 6: Move app files under `[locale]`**

```bash
mkdir -p src/app/'[locale]'
git mv src/app/layout.tsx src/app/'[locale]'/layout.tsx
git mv src/app/page.tsx   src/app/'[locale]'/page.tsx
```

Keep `src/app/globals.css`, `src/app/favicon.ico` at root.

**Step 7: Update `[locale]/layout.tsx` to wire next-intl provider**

```tsx
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import '../globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  const messages = await getMessages();
  return (
    <html lang={locale} className={jakarta.variable}>
      <body className="min-h-screen bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white font-display">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Step 8: Verify dev server**

```bash
pnpm dev
```

Hit `http://localhost:3000/en` and `http://localhost:3000/es` — both should render (even if text not yet translated; messages files next task).

**Step 9: Commit**

```bash
git add -A
git commit -m "feat(i18n): next-intl with [locale] routing (en, es)"
```

---

## Task 11: Phase 0 message catalogs (EN + ES)

**Files:**
- Create: `src/i18n/messages/en.json`
- Create: `src/i18n/messages/es.json`

**Step 1: Write `en.json`**

```json
{
  "home": {
    "title": "When is school out?",
    "subtitle": "Plan something awesome for every day off.",
    "next3": "Next 3 closures",
    "restOfYear": "Rest of school year",
    "countdown": {
      "today": "Today",
      "tomorrow": "Tomorrow",
      "days": "in {days} days"
    }
  },
  "reminderSignup": {
    "headline": "Get reminded before every school closure",
    "body": "We'll email you 2 weeks, 1 week, and 3 days before each break. No spam, unsubscribe anytime.",
    "emailLabel": "Your email",
    "emailPlaceholder": "parent@example.com",
    "ageRangeLabel": "Age range in your family",
    "ageRange": { "4-6": "Ages 4–6", "7-9": "Ages 7–9", "all": "All ages" },
    "coppaConsent": "I'm a parent or legal guardian and consent to receive these emails.",
    "submit": "Remind me before every break",
    "success": "Check your email to confirm your subscription.",
    "error": "Something went wrong. Please try again."
  },
  "closure": {
    "badge": {
      "threeDayWeekend": "3-Day Weekend",
      "longBreak": "Long Break",
      "summer": "Summer"
    }
  },
  "nav": {
    "language": "Language",
    "privacyPolicy": "Privacy Policy",
    "terms": "Terms of Service"
  }
}
```

**Step 2: Write `es.json`** (Claude-generated; flag for native-speaker review)

```json
{
  "home": {
    "title": "¿Cuándo no hay escuela?",
    "subtitle": "Planea algo increíble para cada día libre.",
    "next3": "Próximos 3 días sin escuela",
    "restOfYear": "Resto del año escolar",
    "countdown": {
      "today": "Hoy",
      "tomorrow": "Mañana",
      "days": "en {days} días"
    }
  },
  "reminderSignup": {
    "headline": "Recibe un aviso antes de cada día sin escuela",
    "body": "Te escribiremos 2 semanas, 1 semana y 3 días antes de cada vacación. Sin spam, cancela cuando quieras.",
    "emailLabel": "Tu correo",
    "emailPlaceholder": "padre@ejemplo.com",
    "ageRangeLabel": "Rango de edad en tu familia",
    "ageRange": { "4-6": "4 a 6 años", "7-9": "7 a 9 años", "all": "Todas las edades" },
    "coppaConsent": "Soy madre, padre o tutor legal y doy mi consentimiento para recibir estos correos.",
    "submit": "Recuérdame antes de cada vacación",
    "success": "Revisa tu correo para confirmar tu suscripción.",
    "error": "Algo salió mal. Intenta de nuevo."
  },
  "closure": {
    "badge": {
      "threeDayWeekend": "Fin de semana de 3 días",
      "longBreak": "Vacación larga",
      "summer": "Verano"
    }
  },
  "nav": {
    "language": "Idioma",
    "privacyPolicy": "Política de Privacidad",
    "terms": "Términos del Servicio"
  }
}
```

**Step 3: Add a TODO comment** at the top of `es.json` noting it needs native-speaker review before launch. (JSON doesn't support comments — track via `docs/TODO.md`.)

```bash
mkdir -p docs
cat >> docs/TODO.md <<'EOF'
## Pre-launch blockers
- [ ] Native Spanish-speaker review of src/i18n/messages/es.json
- [ ] Lawyer-drafted COPPA consent + privacy policy + ToS
- [ ] Resend domain verification (schoolsout.net SPF/DKIM)
EOF
```

**Step 4: Commit**

```bash
git add src/i18n/messages docs/TODO.md
git commit -m "feat(i18n): Phase 0 EN + ES message catalogs"
```

---

## Task 12: LanguageToggle component

**Files:**
- Create: `src/components/LanguageToggle.tsx`
- Create: `tests/components/LanguageToggle.test.tsx`

**Step 1: Write the test**

```tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import { LanguageToggle } from '@/components/LanguageToggle';

function wrap(locale: 'en' | 'es') {
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <LanguageToggle currentLocale={locale} />
    </NextIntlClientProvider>
  );
}

describe('LanguageToggle', () => {
  it('shows both locale options', () => {
    wrap('en');
    expect(screen.getByRole('link', { name: /EN/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ES/ })).toBeInTheDocument();
  });

  it('marks current locale as active', () => {
    wrap('es');
    const es = screen.getByRole('link', { name: /ES/ });
    expect(es).toHaveAttribute('aria-current', 'page');
  });
});
```

**Step 2: Run — expect fail.**

**Step 3: Implement**

```tsx
import Link from 'next/link';
import { locales, type Locale } from '@/i18n/config';

export function LanguageToggle({ currentLocale }: { currentLocale: Locale }) {
  return (
    <div className="flex gap-2 text-sm">
      {locales.map((loc) => (
        <Link
          key={loc}
          href={`/${loc}`}
          aria-current={loc === currentLocale ? 'page' : undefined}
          className={
            'px-2 py-1 rounded-full ' +
            (loc === currentLocale ? 'bg-white/20 font-bold' : 'bg-white/5 hover:bg-white/10')
          }
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
```

**Step 4: Run tests — expect pass.**

**Step 5: Commit**

```bash
git add src/components/LanguageToggle.tsx tests/components/LanguageToggle.test.tsx
git commit -m "feat: LanguageToggle component (EN/ES)"
```

---

## Task 13: Countdown utility + badge

**Files:**
- Create: `src/lib/countdown.ts`
- Create: `tests/lib/countdown.test.ts`

**Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { countdownColor, daysUntil } from '@/lib/countdown';

describe('countdown', () => {
  it('daysUntil returns integer day delta from today', () => {
    const today = new Date('2026-04-21T12:00:00Z');
    expect(daysUntil('2026-04-28', today)).toBe(7);
    expect(daysUntil('2026-04-21', today)).toBe(0);
    expect(daysUntil('2026-04-20', today)).toBe(-1);
  });

  it('countdownColor: emerald if <=7, amber if <=30, gray otherwise', () => {
    expect(countdownColor(0)).toBe('emerald');
    expect(countdownColor(7)).toBe('emerald');
    expect(countdownColor(8)).toBe('amber');
    expect(countdownColor(30)).toBe('amber');
    expect(countdownColor(31)).toBe('gray');
  });
});
```

**Step 2: Run — expect fail.**

**Step 3: Implement**

```ts
export function daysUntil(date: string | Date, now: Date = new Date()): number {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function countdownColor(days: number): 'emerald' | 'amber' | 'gray' {
  if (days <= 7) return 'emerald';
  if (days <= 30) return 'amber';
  return 'gray';
}
```

**Step 4: Run tests — expect pass.**

**Step 5: Commit**

```bash
git add src/lib/countdown.ts tests/lib/countdown.test.ts
git commit -m "feat: countdown utility (daysUntil + color buckets)"
```

---

## Task 14: ClosureCard component

**Files:**
- Create: `src/components/ClosureCard.tsx`
- Create: `tests/components/ClosureCard.test.tsx`

**Step 1: Write the test**

```tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import { ClosureCard } from '@/components/ClosureCard';

const messages = {
  home: { countdown: { today: 'Today', tomorrow: 'Tomorrow', days: 'in {days} days' } },
  closure: { badge: { threeDayWeekend: '3-Day Weekend', longBreak: 'Long Break', summer: 'Summer' } },
};

function wrap(closure: Parameters<typeof ClosureCard>[0]['closure']) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ClosureCard closure={closure} today={new Date('2026-04-21T12:00:00Z')} />
    </NextIntlClientProvider>
  );
}

describe('ClosureCard', () => {
  it('renders name, emoji, and date range', () => {
    wrap({ id: '1', name: 'Spring Break', start_date: '2026-04-28', end_date: '2026-05-02', emoji: '🌸' });
    expect(screen.getByText('Spring Break')).toBeInTheDocument();
    expect(screen.getByText('🌸')).toBeInTheDocument();
    expect(screen.getByText(/in 7 days/i)).toBeInTheDocument();
  });

  it('shows long-break badge for 5+ days', () => {
    wrap({ id: '1', name: 'Spring Break', start_date: '2026-04-28', end_date: '2026-05-02', emoji: '🌸' });
    expect(screen.getByText(/Long Break/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run — expect fail.**

**Step 3: Implement**

```tsx
import { useTranslations } from 'next-intl';
import { countdownColor, daysUntil } from '@/lib/countdown';

export type ClosureCardProps = {
  closure: { id: string; name: string; start_date: string; end_date: string; emoji: string };
  today?: Date;
};

function breakBadge(start: string, end: string) {
  const days = daysUntil(end, new Date(start + 'T00:00:00Z')) + 1;
  if (days >= 30) return 'summer';
  if (days >= 5) return 'longBreak';
  if (days >= 3) return 'threeDayWeekend';
  return null;
}

const colorClasses = {
  emerald: 'bg-success/20 text-success',
  amber: 'bg-amber-400/20 text-amber-200',
  gray: 'bg-white/10 text-white/70',
};

export function ClosureCard({ closure, today }: ClosureCardProps) {
  const t = useTranslations();
  const days = daysUntil(closure.start_date, today);
  const color = colorClasses[countdownColor(days)];
  const badge = breakBadge(closure.start_date, closure.end_date);

  const countdown =
    days === 0 ? t('home.countdown.today')
    : days === 1 ? t('home.countdown.tomorrow')
    : t('home.countdown.days', { days });

  return (
    <article className="rounded-2xl bg-white/10 backdrop-blur p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-5xl" aria-hidden="true">{closure.emoji}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{countdown}</span>
      </div>
      <h3 className="text-xl font-bold">{closure.name}</h3>
      <p className="text-sm text-white/70">
        {new Date(closure.start_date).toLocaleDateString()} – {new Date(closure.end_date).toLocaleDateString()}
      </p>
      {badge && (
        <span className="text-xs inline-block w-fit bg-cta-yellow/20 text-cta-yellow px-2 py-0.5 rounded-full">
          {t(`closure.badge.${badge}`)}
        </span>
      )}
    </article>
  );
}
```

**Step 4: Run tests — expect pass.**

**Step 5: Commit**

```bash
git add src/components/ClosureCard.tsx tests/components/ClosureCard.test.tsx
git commit -m "feat: ClosureCard with emoji, countdown, break-type badge"
```

---

## Task 15: Closures query + types

**Files:**
- Create: `src/lib/closures.ts`
- Create: `tests/lib/closures.test.ts`

**Step 1: Write the test**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getUpcomingClosures } from '@/lib/closures';

const skip = !process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(skip)('getUpcomingClosures', () => {
  const db = createServiceSupabase();

  beforeAll(async () => {
    await db.from('closures').update({ status: 'verified' }).eq('school_id', '00000000-0000-0000-0000-000000000001');
  });

  it('returns only verified closures for a school, ordered by start_date', async () => {
    const rows = await getUpcomingClosures('00000000-0000-0000-0000-000000000001', new Date('2026-04-21'));
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(new Date(r.start_date).getTime()).toBeGreaterThanOrEqual(new Date('2026-04-21').getTime()));
    for (let i = 1; i < rows.length; i++) {
      expect(new Date(rows[i].start_date) >= new Date(rows[i - 1].start_date)).toBe(true);
    }
  });
});
```

**Step 2: Run — expect fail.**

**Step 3: Implement**

```ts
import { createServiceSupabase } from '@/lib/supabase/service';

export type Closure = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
};

export async function getUpcomingClosures(schoolId: string, today: Date = new Date()): Promise<Closure[]> {
  const db = createServiceSupabase();
  const isoToday = today.toISOString().slice(0, 10);
  const { data, error } = await db
    .from('closures')
    .select('id, school_id, name, start_date, end_date, emoji')
    .eq('school_id', schoolId)
    .eq('status', 'verified')
    .gte('start_date', isoToday)
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
```

**Step 4: Run tests — expect pass.**

**Step 5: Commit**

```bash
git add src/lib/closures.ts tests/lib/closures.test.ts
git commit -m "feat: getUpcomingClosures (verified-only, date-ordered)"
```

---

## Task 16: Home page

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/layout.tsx` (header with LanguageToggle)

**Step 1: Update the layout to show a header**

```tsx
// in LocaleLayout body, before {children}:
<header className="flex items-center justify-between p-4">
  <span className="text-lg font-bold">School's Out! 🎒</span>
  <LanguageToggle currentLocale={locale as Locale} />
</header>
```

Add the import at top.

**Step 2: Replace `src/app/[locale]/page.tsx`**

```tsx
import { getUpcomingClosures } from '@/lib/closures';
import { ClosureCard } from '@/components/ClosureCard';
import { ReminderSignup } from '@/components/ReminderSignup';
import { getTranslations } from 'next-intl/server';

const NOAH_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

export default async function Home({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations();
  const closures = await getUpcomingClosures(NOAH_SCHOOL_ID);
  const next3 = closures.slice(0, 3);
  const rest = closures.slice(3);

  return (
    <main className="max-w-3xl mx-auto px-4 pb-20">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold">{t('home.title')}</h1>
        <p className="mt-2 text-white/70">{t('home.subtitle')}</p>
      </section>

      <ReminderSignup schoolId={NOAH_SCHOOL_ID} locale={locale} />

      <section className="mt-10">
        <h2 className="text-lg font-bold mb-3">{t('home.next3')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {next3.map((c) => (<ClosureCard key={c.id} closure={c} />))}
        </div>
      </section>

      {rest.length > 0 && (
        <details className="mt-8 bg-white/5 rounded-2xl p-4">
          <summary className="cursor-pointer font-bold">{t('home.restOfYear')}</summary>
          <ul className="mt-3 space-y-2">
            {rest.map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <span>{c.emoji} {c.name}</span>
                <span className="text-white/60">
                  {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
```

**Step 3: Stub `ReminderSignup` so the page compiles** (implemented in Task 17):

```tsx
// src/components/ReminderSignup.tsx
export function ReminderSignup({ schoolId, locale }: { schoolId: string; locale: string }) {
  return <div data-testid="reminder-signup-stub" data-school={schoolId} data-locale={locale} />;
}
```

**Step 4: Start dev server and eyeball**

```bash
pnpm dev
```

Hit `http://localhost:3000/en` → see 3 cards + accordion with remaining closures. Hit `/es` → same layout with Spanish labels.

**Step 5: Commit**

```bash
git add src/app src/components/ReminderSignup.tsx
git commit -m "feat: anonymous home page with next 3 closures and accordion"
```

---

## Task 17: ReminderSignup component

**Files:**
- Modify: `src/components/ReminderSignup.tsx`
- Create: `tests/components/ReminderSignup.test.tsx`

**Step 1: Write the test (form validation)**

```tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderSignup } from '@/components/ReminderSignup';
import messages from '@/i18n/messages/en.json';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ReminderSignup schoolId="school-123" locale="en" />
    </NextIntlClientProvider>,
  );
}

describe('ReminderSignup', () => {
  it('submits email + school_id + age_range + consent to /api/reminders/subscribe', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText('parent@example.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByLabelText(/I'm a parent/i));
    fireEvent.click(screen.getByRole('button', { name: /Remind me/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reminders/subscribe',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ email: 'a@b.com', school_id: 'school-123', age_range: 'all', locale: 'en' });
  });

  it('does not submit if consent unchecked', async () => {
    wrap();
    fireEvent.change(screen.getByPlaceholderText('parent@example.com'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Remind me/i }));
    await new Promise((r) => setTimeout(r, 50));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run — expect fail.**

**Step 3: Replace `src/components/ReminderSignup.tsx`**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function ReminderSignup({ schoolId, locale }: { schoolId: string; locale: string }) {
  const t = useTranslations('reminderSignup');
  const [email, setEmail] = useState('');
  const [ageRange, setAgeRange] = useState<'4-6' | '7-9' | 'all'>('all');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setStatus('submitting');
    const res = await fetch('/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, school_id: schoolId, age_range: ageRange, locale }),
    });
    setStatus(res.ok ? 'success' : 'error');
  }

  if (status === 'success') {
    return <p className="rounded-2xl bg-success/20 text-success p-6 text-center">{t('success')}</p>;
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/10 p-6 flex flex-col gap-3">
      <h2 className="text-2xl font-bold">{t('headline')}</h2>
      <p className="text-sm text-white/80">{t('body')}</p>

      <label className="flex flex-col gap-1 text-sm">
        <span>{t('emailLabel')}</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="rounded-xl px-3 py-2 text-black" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{t('ageRangeLabel')}</span>
        <select value={ageRange} onChange={(e) => setAgeRange(e.target.value as any)}
          className="rounded-xl px-3 py-2 text-black">
          <option value="all">{t('ageRange.all')}</option>
          <option value="4-6">{t('ageRange.4-6')}</option>
          <option value="7-9">{t('ageRange.7-9')}</option>
        </select>
      </label>

      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t('coppaConsent')}</span>
      </label>

      <button type="submit"
        disabled={!consent || status === 'submitting'}
        className="mt-2 bg-cta-yellow text-purple-deep font-bold rounded-xl px-4 py-3 disabled:opacity-50">
        {t('submit')}
      </button>

      {status === 'error' && <p className="text-red-400 text-sm">{t('error')}</p>}
    </form>
  );
}
```

**Step 4: Run tests — expect pass.**

**Step 5: Commit**

```bash
git add src/components/ReminderSignup.tsx tests/components/ReminderSignup.test.tsx
git commit -m "feat: ReminderSignup form with COPPA consent + language-aware submit"
```

---

## Task 18: `/api/reminders/subscribe` route

**Files:**
- Create: `src/app/api/reminders/subscribe/route.ts`
- Create: `src/lib/tokens.ts`
- Create: `tests/api/reminders-subscribe.test.ts`

**Step 1: Write `src/lib/tokens.ts`**

```ts
import { createHmac, randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

export function newToken(): string {
  return randomBytes(24).toString('base64url');
}

export function signToken(payload: string): string {
  return createHmac('sha256', env.CRON_SECRET).update(payload).digest('base64url');
}

export function verifyToken(payload: string, sig: string): boolean {
  return signToken(payload) === sig;
}
```

**Step 2: Write the test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock }; } }));

beforeEach(() => { sendMock.mockClear(); });

describe('POST /api/reminders/subscribe', () => {
  it('rejects payload missing consent-backed fields', async () => {
    const { POST } = await import('@/app/api/reminders/subscribe/route');
    const res = await POST(new Request('http://localhost/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ school_id: 'x' }),
    }));
    expect(res.status).toBe(400);
  });

  it('creates subscription and sends confirmation email', async () => {
    const { POST } = await import('@/app/api/reminders/subscribe/route');
    const res = await POST(new Request('http://localhost/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'a@b.com',
        school_id: '00000000-0000-0000-0000-000000000001',
        age_range: 'all',
        locale: 'en',
      }),
    }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
  });
});
```

**Step 3: Run — expect fail.**

**Step 4: Implement `src/app/api/reminders/subscribe/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { env } from '@/lib/env';

const schema = z.object({
  email: z.string().email(),
  school_id: z.string().uuid(),
  age_range: z.enum(['4-6', '7-9', 'all']),
  locale: z.enum(['en', 'es']),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { email, school_id, age_range, locale } = parsed.data;
  const db = createServiceSupabase();

  const { data: authRes, error: authErr } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${env.APP_URL}/${locale}/reminders/confirm`,
    data: { preferred_language: locale, coppa_consent_at: new Date().toISOString() },
  });
  // If user already exists, inviteUserByEmail errors; in that case fetch by email.
  let userId = authRes?.user?.id;
  if (authErr) {
    const { data: list } = await db.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === email)?.id;
  }
  if (!userId) return NextResponse.json({ error: 'user_creation_failed' }, { status: 500 });

  await db.from('users').update({ preferred_language: locale }).eq('id', userId);

  const { error } = await db
    .from('reminder_subscriptions')
    .upsert(
      { user_id: userId, school_id, age_range, enabled: true },
      { onConflict: 'user_id,school_id' },
    );
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });

  const resend = new Resend(env.RESEND_API_KEY);
  const subject = locale === 'es'
    ? 'Confirma tu suscripción a School\'s Out!'
    : "Confirm your School's Out! reminder subscription";
  await resend.emails.send({
    from: "School's Out! <hello@schoolsout.net>",
    to: email,
    subject,
    html: locale === 'es'
      ? `<p>Haz clic para confirmar tu correo. Ya casi: revisa tu bandeja por el enlace mágico.</p>`
      : `<p>We sent a magic link to confirm your email. Check your inbox to finish signup.</p>`,
  });

  return NextResponse.json({ ok: true });
}
```

> **Note:** `inviteUserByEmail` uses Supabase's built-in email provider. In production, configure Supabase to use Resend as custom SMTP so the magic-link email is also branded/bilingual. For Phase 0 this is acceptable: the confirmation email sent via Resend above gives the user a heads-up in their language, and the Supabase magic link email follows.

**Step 5: Run tests — expect pass.**

**Step 6: Commit**

```bash
git add src/app/api/reminders/subscribe src/lib/tokens.ts tests/api/reminders-subscribe.test.ts
git commit -m "feat(api): POST /api/reminders/subscribe creates user, subscription, sends email"
```

---

## Task 19: Confirm + unsubscribe routes

**Files:**
- Create: `src/app/[locale]/reminders/confirm/page.tsx`
- Create: `src/app/api/reminders/unsubscribe/route.ts`

**Step 1: Confirm page** — handles the Supabase magic-link callback:

```tsx
// src/app/[locale]/reminders/confirm/page.tsx
import { createServerSupabase } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';

export default async function ConfirmPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations();
  return (
    <main className="max-w-md mx-auto p-8 text-center">
      {user
        ? <h1 className="text-2xl font-bold">✅ {t('reminderSignup.success')}</h1>
        : <h1 className="text-2xl font-bold">⚠️ {t('reminderSignup.error')}</h1>}
    </main>
  );
}
```

**Step 2: Unsubscribe route** — one-click, token-based:

```ts
// src/app/api/reminders/unsubscribe/route.ts
import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { verifyToken } from '@/lib/tokens';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sub = url.searchParams.get('sub');
  const sig = url.searchParams.get('sig');
  if (!sub || !sig || !verifyToken(sub, sig)) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }
  const db = createServiceSupabase();
  const { error } = await db.from('reminder_subscriptions').update({ enabled: false }).eq('id', sub);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.redirect(new URL('/en', url));
}
```

**Step 3: Test** — add to `tests/api/reminders-unsubscribe.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/reminders/unsubscribe/route';
import { signToken } from '@/lib/tokens';

describe('GET /api/reminders/unsubscribe', () => {
  it('rejects missing token', async () => {
    const res = await GET(new Request('http://localhost/api/reminders/unsubscribe'));
    expect(res.status).toBe(400);
  });

  it('rejects bad signature', async () => {
    const res = await GET(new Request('http://localhost/api/reminders/unsubscribe?sub=abc&sig=xxx'));
    expect(res.status).toBe(400);
  });

  it('accepts valid signature', async () => {
    const sub = 'fake-uuid';
    const sig = signToken(sub);
    const res = await GET(new Request(`http://localhost/api/reminders/unsubscribe?sub=${sub}&sig=${sig}`));
    // db_error expected in test since row doesn't exist — but signature passed the check
    expect([302, 500]).toContain(res.status);
  });
});
```

**Step 4: Run tests — expect pass.**

**Step 5: Commit**

```bash
git add src/app/'[locale]'/reminders src/app/api/reminders/unsubscribe tests/api/reminders-unsubscribe.test.ts
git commit -m "feat(api): reminder confirmation page + signed one-click unsubscribe"
```

---

## Task 20: Bilingual React Email reminder template

**Files:**
- Create: `src/lib/email/ReminderEmail.tsx`
- Create: `tests/lib/email/ReminderEmail.test.tsx`

**Step 1: Write test (render + include key data)**

```tsx
import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import { ReminderEmail } from '@/lib/email/ReminderEmail';

describe('ReminderEmail', () => {
  it('renders English content with closure name and days_before', async () => {
    const html = await render(ReminderEmail({
      locale: 'en',
      closureName: 'Spring Break',
      startDate: '2026-04-28',
      endDate: '2026-05-02',
      emoji: '🌸',
      daysBefore: 7,
      unsubscribeUrl: 'https://schoolsout.net/api/reminders/unsubscribe?sub=x&sig=y',
    }));
    expect(html).toMatch(/Spring Break/);
    expect(html).toMatch(/in 7 days/);
    expect(html).toMatch(/unsubscribe/i);
  });

  it('renders Spanish content when locale=es', async () => {
    const html = await render(ReminderEmail({
      locale: 'es',
      closureName: 'Vacaciones de Primavera',
      startDate: '2026-04-28',
      endDate: '2026-05-02',
      emoji: '🌸',
      daysBefore: 7,
      unsubscribeUrl: 'https://schoolsout.net/api/reminders/unsubscribe?sub=x&sig=y',
    }));
    expect(html).toMatch(/Vacaciones/);
    expect(html).toMatch(/en 7 días/);
  });
});
```

**Step 2: Implement**

```tsx
import { Html, Body, Container, Heading, Text, Button, Hr, Link } from '@react-email/components';

type Props = {
  locale: 'en' | 'es';
  closureName: string;
  startDate: string;
  endDate: string;
  emoji: string;
  daysBefore: 3 | 7 | 14;
  unsubscribeUrl: string;
};

const copy = {
  en: {
    heading: (days: number) => `${days === 14 ? '🗓️' : days === 7 ? '⏳' : '🚨'} School's out in ${days} days`,
    intro: (n: string) => `Heads up — ${n} is coming up.`,
    cta: 'Plan it now',
    unsubscribe: 'Unsubscribe',
  },
  es: {
    heading: (days: number) => `${days === 14 ? '🗓️' : days === 7 ? '⏳' : '🚨'} No hay escuela en ${days} días`,
    intro: (n: string) => `¡Atención! Se acerca ${n}.`,
    cta: 'Planéalo ahora',
    unsubscribe: 'Cancelar suscripción',
  },
} as const;

export function ReminderEmail({ locale, closureName, startDate, endDate, emoji, daysBefore, unsubscribeUrl }: Props) {
  const c = copy[locale];
  const days = daysBefore;
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale);
  return (
    <Html lang={locale}>
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#1a0b2e', color: '#fff' }}>
        <Container style={{ padding: 32 }}>
          <Heading style={{ fontSize: 24 }}>{c.heading(days)}</Heading>
          <Text style={{ fontSize: 48, margin: 0 }}>{emoji}</Text>
          <Heading as="h2" style={{ fontSize: 20 }}>{closureName}</Heading>
          <Text>{c.intro(closureName)}</Text>
          <Text>{fmt(startDate)} – {fmt(endDate)}</Text>
          <Button href="https://schoolsout.net" style={{ background: '#facc15', color: '#1a0b2e', padding: '12px 20px', borderRadius: 12, fontWeight: 700 }}>
            {c.cta}
          </Button>
          <Hr style={{ borderColor: '#444', marginTop: 32 }} />
          <Text style={{ fontSize: 11, color: '#aaa' }}>
            <Link href={unsubscribeUrl} style={{ color: '#aaa' }}>{c.unsubscribe}</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

**Step 3: Run tests — expect pass.**

**Step 4: Commit**

```bash
git add src/lib/email tests/lib/email
git commit -m "feat(email): bilingual ReminderEmail React Email template"
```

---

## Task 21: `/api/cron/send-reminders`

**Files:**
- Create: `src/app/api/cron/send-reminders/route.ts`
- Create: `tests/api/send-reminders.test.ts`

**Step 1: Test — idempotency + date filter**

```ts
import { describe, it, expect, vi } from 'vitest';
import { computeReminderWindow } from '@/app/api/cron/send-reminders/dates';

describe('computeReminderWindow', () => {
  it('returns three ISO dates for 3, 7, 14 days out', () => {
    const today = new Date('2026-04-21T12:00:00Z');
    const { d3, d7, d14 } = computeReminderWindow(today);
    expect(d3).toBe('2026-04-24');
    expect(d7).toBe('2026-04-28');
    expect(d14).toBe('2026-05-05');
  });
});
```

**Step 2: Implement**

`src/app/api/cron/send-reminders/dates.ts`:

```ts
function addDays(d: Date, n: number): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
  return x.toISOString().slice(0, 10);
}
export function computeReminderWindow(today: Date = new Date()) {
  return { d3: addDays(today, 3), d7: addDays(today, 7), d14: addDays(today, 14) };
}
```

`src/app/api/cron/send-reminders/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { computeReminderWindow } from './dates';
import { ReminderEmail } from '@/lib/email/ReminderEmail';
import { signToken } from '@/lib/tokens';

function authorize(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = createServiceSupabase();
  const resend = new Resend(env.RESEND_API_KEY);
  const { d3, d7, d14 } = computeReminderWindow();

  const { data: closures } = await db
    .from('closures')
    .select('id, school_id, name, start_date, end_date, emoji')
    .eq('status', 'verified')
    .in('start_date', [d3, d7, d14]);

  let sent = 0;
  for (const c of closures ?? []) {
    const days = c.start_date === d3 ? 3 : c.start_date === d7 ? 7 : 14;
    const { data: subs } = await db
      .from('reminder_subscriptions')
      .select('id, user_id, users!inner(email, preferred_language)')
      .eq('school_id', c.school_id)
      .eq('enabled', true);
    for (const s of subs ?? []) {
      const { error: dedupErr } = await db
        .from('reminder_sends')
        .insert({ subscription_id: s.id, closure_id: c.id, days_before: days });
      if (dedupErr) continue; // unique constraint = already sent

      const sub = s as any;
      const locale = sub.users.preferred_language as 'en' | 'es';
      const unsubscribeUrl = `${env.APP_URL}/api/reminders/unsubscribe?sub=${s.id}&sig=${signToken(s.id)}`;
      const html = await render(ReminderEmail({
        locale, closureName: c.name, startDate: c.start_date, endDate: c.end_date,
        emoji: c.emoji, daysBefore: days as 3 | 7 | 14, unsubscribeUrl,
      }));
      await resend.emails.send({
        from: "School's Out! <reminders@schoolsout.net>",
        to: sub.users.email,
        subject: locale === 'es' ? `⏳ ${c.name} en ${days} días` : `⏳ ${c.name} in ${days} days`,
        html,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
```

**Step 3: Run tests — expect pass.**

**Step 4: Commit**

```bash
git add src/app/api/cron/send-reminders tests/api/send-reminders.test.ts
git commit -m "feat(cron): daily send-reminders job with idempotency + List-Unsubscribe header"
```

---

## Task 22: Resend webhook handler (open + click tracking)

**Files:**
- Create: `src/app/api/webhooks/resend/route.ts`
- Create: `tests/api/resend-webhook.test.ts`

**Step 1: Test**

```ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/resend/route';

describe('POST /api/webhooks/resend', () => {
  it('accepts email.opened event', async () => {
    const body = { type: 'email.opened', data: { email_id: 'abc', tags: [{ name: 'send_id', value: 'send-uuid' }] } };
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Implement**

```ts
import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.type) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const sendId = body?.data?.tags?.find?.((t: any) => t.name === 'send_id')?.value;
  if (!sendId) return NextResponse.json({ ok: true });

  const db = createServiceSupabase();
  const update = body.type === 'email.opened'   ? { opened_at: new Date().toISOString() }
               : body.type === 'email.clicked'  ? { clicked_at: new Date().toISOString() }
               : null;
  if (update) await db.from('reminder_sends').update(update).eq('id', sendId);
  return NextResponse.json({ ok: true });
}
```

**Step 3: Run tests — expect pass.**

**Step 4: Extend `send-reminders` to tag emails with `send_id`**

In Task 21's `route.ts`, when calling `resend.emails.send`, first insert the row and get its id back; then tag:

```ts
const { data: inserted, error: dedupErr } = await db
  .from('reminder_sends')
  .insert({ subscription_id: s.id, closure_id: c.id, days_before: days })
  .select('id')
  .single();
if (dedupErr) continue;

// ... compute html ...
await resend.emails.send({
  // ... other fields ...
  tags: [{ name: 'send_id', value: inserted.id }],
});
```

**Step 5: Commit**

```bash
git add src/app/api/webhooks src/app/api/cron/send-reminders/route.ts tests/api/resend-webhook.test.ts
git commit -m "feat(webhooks): track email opened/clicked via Resend webhook tags"
```

---

## Task 23: Privacy policy + ToS placeholder pages

**Files:**
- Create: `src/app/[locale]/privacy/page.tsx`
- Create: `src/app/[locale]/terms/page.tsx`
- Modify: `src/app/[locale]/layout.tsx` (footer links)

**Step 1: Placeholder pages**

```tsx
// src/app/[locale]/privacy/page.tsx
import { getTranslations } from 'next-intl/server';
export default async function Privacy() {
  const t = await getTranslations();
  return (
    <main className="max-w-2xl mx-auto p-6 prose prose-invert">
      <h1>{t('nav.privacyPolicy')}</h1>
      <p><strong>TODO:</strong> Replace this placeholder with lawyer-drafted privacy policy before launch. Required before collecting email signups in production.</p>
      <p>This app does not store children's names, exact ages, or specific schools on the server. Parents provide an email to receive school-closure reminders. Kid profile data (if any) lives only in the parent's browser.</p>
    </main>
  );
}
```

```tsx
// src/app/[locale]/terms/page.tsx
import { getTranslations } from 'next-intl/server';
export default async function Terms() {
  const t = await getTranslations();
  return (
    <main className="max-w-2xl mx-auto p-6 prose prose-invert">
      <h1>{t('nav.terms')}</h1>
      <p><strong>TODO:</strong> Replace this placeholder with lawyer-drafted terms of service before launch.</p>
    </main>
  );
}
```

**Step 2: Footer in the layout**

```tsx
<footer className="text-center text-xs text-white/50 py-6">
  <Link href={`/${locale}/privacy`} className="underline">{t('nav.privacyPolicy')}</Link>
  {' · '}
  <Link href={`/${locale}/terms`} className="underline">{t('nav.terms')}</Link>
</footer>
```

**Step 3: Add "lawyer-drafted privacy policy + ToS" to `docs/TODO.md` (already there from Task 11; verify).**

**Step 4: Commit**

```bash
git add src/app/'[locale]'/privacy src/app/'[locale]'/terms src/app/'[locale]'/layout.tsx
git commit -m "feat: placeholder privacy + terms pages (TODO: lawyer-drafted copy)"
```

---

## Task 24: Vercel Cron config

**Files:**
- Create: `vercel.json`

**Step 1: Write `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 12 * * *"
    }
  ]
}
```

(12:00 UTC = 8am ET during EDT, 7am ET during EST. Good enough for Phase 0.)

**Step 2: Document the `CRON_SECRET` requirement in `README.md`**

Append:

```
### Scheduled jobs

Vercel Cron calls `/api/cron/send-reminders` daily. The route requires
`Authorization: Bearer $CRON_SECRET`. Set `CRON_SECRET` in Vercel env settings
and configure the cron auth header per https://vercel.com/docs/cron-jobs/manage-cron-jobs.
```

**Step 3: Commit**

```bash
git add vercel.json README.md
git commit -m "chore: daily Vercel Cron for send-reminders"
```

---

## Task 25: Link Supabase project + deploy to Vercel

**Files:** none (deploy-only task)

**Step 1: Create the hosted Supabase project**

Via browser (this is a human step):

```
1. Log in to https://supabase.com
2. Create new project: schoolsout-prod (Free tier, us-east-1)
3. Copy: Project URL, anon key, service_role key
```

**Step 2: Push migrations + seed to hosted Supabase**

```bash
pnpm exec supabase link --project-ref YOUR_REF
pnpm exec supabase db push
pnpm exec supabase db execute --file supabase/seed.sql
```

**Step 3: Configure Resend**

```
1. Log in to https://resend.com
2. Add and verify the schoolsout.net domain (SPF + DKIM)
3. Create an API key → save to RESEND_API_KEY
```

**Step 4: Create Vercel project**

```bash
pnpm dlx vercel link
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
pnpm dlx vercel env add SUPABASE_SERVICE_ROLE_KEY production
pnpm dlx vercel env add RESEND_API_KEY production
pnpm dlx vercel env add CRON_SECRET production
pnpm dlx vercel env add APP_URL production   # https://schoolsout.net
```

**Step 5: Deploy**

```bash
pnpm dlx vercel --prod
```

**Step 6: Smoke test the live URL**

- `https://schoolsout.net/en` → renders with 3 closures.
- `https://schoolsout.net/es` → renders with Spanish strings.
- Sign up for reminders with a personal email → confirm via magic link → verify row in `reminder_subscriptions`.
- Manually trigger cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://schoolsout.net/api/cron/send-reminders` → expect a response with `sent` count.
- Open the reminder email → check `reminder_sends.opened_at` updates within a minute.
- Click the unsubscribe link → row flips `enabled=false`.

**Step 7: Commit the smoke-test results** (for audit trail):

```bash
cat > docs/phase-0-smoke-test.md <<'EOF'
# Phase 0 smoke test — 2026-04-21
- [x] EN home renders
- [x] ES home renders
- [x] Reminder signup → subscription row created
- [x] Magic link confirms user
- [x] Manual cron trigger sends email
- [x] Open tracking updates
- [x] Unsubscribe disables subscription
EOF
git add docs/phase-0-smoke-test.md
git commit -m "docs: Phase 0 smoke-test checklist"
```

---

## Task 26: Final Phase 0 verification

**Step 1: Run the full test suite**

```bash
pnpm test
```

Expected: all tests pass.

**Step 2: Run lint**

```bash
pnpm lint
```

Expected: no errors.

**Step 3: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

**Step 4: Tag the release**

```bash
git tag -a phase-0-mvp -m "Phase 0 MVP: calendar + bilingual + email reminders"
```

**Step 5: Update `docs/TODO.md` with post-launch items**

Already captured: Spanish review, lawyer review, Resend domain verify. Add:

```
## Post-Phase-0
- [ ] Distribute to Noah's school community (PTO email, NextDoor, WhatsApp)
- [ ] Measure: weekly signups, open rate, click rate
- [ ] Gate for Phase 1 expansion: 50 signups + any open rate
- [ ] Gate for Phase 2 build: 200 signups + 40% open rate + 10 schools + 10 Launch Partner camps
```

```bash
git add docs/TODO.md
git commit -m "docs: post-Phase-0 distribution + gate checklist"
```

---

## Phase 0 complete

At this point:

- The 2-week dumb MVP is live at `https://schoolsout.net`.
- 1 school has verified closures displayed.
- Bilingual EN/ES toggle works.
- Email signup creates a Supabase user + reminder subscription.
- Daily cron sends bilingual reminders via Resend 14/7/3 days before each closure.
- Open/click tracking records engagement.
- One-click unsubscribe works.
- Privacy policy + ToS are placeholder pages with a visible TODO for lawyer-drafted copy.
- No kid names, no exact ages, no specific schools stored server-side.

**What's NOT done (by design — Phase 2+ per @docs/plans/2026-04-21-schoolsout-v3.1-design.md):**
- Login page, password auth, Google OAuth
- Onboarding (3-step district/age/interest)
- Camps marketplace
- Saved camps
- Camp operator self-service
- AI features (Plan My Break, chat, calendar parser)
- Weather widget
- Launch Partner program infrastructure
- Lawyer-drafted privacy policy + ToS (TODO'd, budget $500–1500)

**Gate to Phase 2:**
Do not start building Phase 2 features until the following are observed in production:
- 200 reminder subscribers
- Email open rate > 40%
- 10 schools with verified calendars
- 10 Launch Partner camps signed (Phase 1 sales work)

If reminders or open rate miss, iterate Phase 1 (distribution, subject lines, send cadence) before building more features.

---

**End of Phase 0 Implementation Plan.**
