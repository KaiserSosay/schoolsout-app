import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Integration smoke test on the Settings page wiring. The page itself is a
// server component that calls supabase.auth.admin.getUserById — exercising
// that end-to-end requires a service-role client + a real auth user, which
// vitest can't construct in unit-test land.
//
// Instead we verify the static contract: the page imports the form, looks
// up the user's password presence via the admin API, and passes the
// resulting boolean down. Component-level "Set" vs "Change" rendering is
// covered exhaustively in tests/components/app/SetPasswordForm.test.tsx.

const PAGE_PATH = path.join(
  process.cwd(),
  'src/app/[locale]/app/settings/page.tsx',
);
const SOURCE = readFileSync(PAGE_PATH, 'utf8');

describe('Settings page — password section wiring', () => {
  it('imports SetPasswordForm', () => {
    expect(SOURCE).toMatch(
      /import \{ SetPasswordForm \} from '@\/components\/app\/SetPasswordForm'/,
    );
  });

  it('imports the service-role supabase helper for password detection', () => {
    expect(SOURCE).toMatch(
      /import \{ createServiceSupabase \} from '@\/lib\/supabase\/service'/,
    );
  });

  it('renders <SetPasswordForm currentlyHasPassword={...} />', () => {
    expect(SOURCE).toMatch(
      /<SetPasswordForm\s+currentlyHasPassword=\{currentlyHasPassword\}\s*\/>/,
    );
  });

  it('derives currentlyHasPassword from auth.admin.getUserById', () => {
    expect(SOURCE).toMatch(/auth\.admin\.getUserById\(user\.id\)/);
    expect(SOURCE).toMatch(/encrypted_password/);
    expect(SOURCE).toMatch(/const\s+currentlyHasPassword\s*=/);
  });
});
