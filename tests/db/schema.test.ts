import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const skip = !url || !key;

describe.skipIf(skip)('schema', () => {
  // Fallback values used only when skip=false; when skip=true the describe body
  // still runs during collection, so passing safe placeholders prevents
  // createClient from throwing in environments where env vars are unset.
  const db = createClient(url ?? 'http://localhost', key ?? 'placeholder');

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
