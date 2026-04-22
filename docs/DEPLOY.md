# School's Out! — Deploy Checklist (tomorrow morning)

Phase 0 MVP is built. All code is committed on `main`. The remaining work is credential setup and deploy, which requires human action.

## 1. Create hosted Supabase project (~5 min)

1. Log in to https://supabase.com
2. Create new project: `schoolsout-prod` (Free tier, `us-east-1`)
3. Once provisioned, copy from Settings → API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## 2. Push migrations + seed to hosted Supabase

```bash
cd /Users/rasheidscarlett/Projects/schoolsout-app
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_REF
pnpm exec supabase db push
pnpm exec supabase db execute --file supabase/seed.sql
```

Verify via Supabase Studio:
- 1 row in `schools` ("The Growing Place")
- 8 rows in `closures` (all `status='verified'`)

## 3. Configure Resend (~5 min)

1. Log in to https://resend.com
2. Add domain `schoolsout.net`
3. Configure DNS (SPF, DKIM records) — follow Resend's prompts
4. Wait for verification (can take up to 1 hr for DNS propagation)
5. Create an API key → copy to `RESEND_API_KEY`

Until DNS verifies, you can still test with Resend's `onboarding@resend.dev` test sender.

## 4. Create Vercel project (~5 min)

```bash
pnpm dlx vercel login
pnpm dlx vercel link
```

Then add env vars (prod only for now):

```bash
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_URL production
pnpm dlx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
pnpm dlx vercel env add SUPABASE_SERVICE_ROLE_KEY production
pnpm dlx vercel env add RESEND_API_KEY production
pnpm dlx vercel env add CRON_SECRET production       # generate: openssl rand -base64 32
pnpm dlx vercel env add APP_URL production            # https://schoolsout.net
```

## 5. Deploy

```bash
pnpm dlx vercel --prod
```

## 6. Point DNS

In your domain registrar, point `schoolsout.net` → Vercel (either A records or Vercel's nameservers).

## 7. Smoke test (see docs/phase-0-smoke-test.md)

- `https://schoolsout.net/en` renders with closures
- `https://schoolsout.net/es` renders with Spanish strings
- Reminder signup creates a `reminder_subscriptions` row
- Magic-link confirm works
- Manual cron trigger sends an email:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://schoolsout.net/api/cron/send-reminders
  ```
- Open tracking updates `reminder_sends.opened_at`
- Unsubscribe disables the subscription

## 8. Configure Supabase magic-link redirect

In Supabase dashboard: Authentication → URL Configuration → add `https://schoolsout.net/*` to Redirect URLs.

## 9. Handle Supabase email template (optional for Phase 0)

Supabase sends the signup magic-link via its built-in provider by default (English-only). For bilingual magic links in Phase 1.5+, configure Supabase to use Resend as custom SMTP:
- Supabase → Settings → Auth → SMTP Settings → paste Resend SMTP credentials
- Customize email templates per `docs/TODO.md`
