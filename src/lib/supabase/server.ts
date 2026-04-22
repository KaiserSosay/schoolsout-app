import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export function createServerSupabase() {
  const store = cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (name) => store.get(name)?.value,
      set: (name, value, options: CookieOptions) => {
        try {
          store.set({ name, value, ...options });
        } catch {
          /* route handlers may be readonly */
        }
      },
      remove: (name, options: CookieOptions) => {
        try {
          store.set({ name, value: '', ...options });
        } catch {
          /* noop */
        }
      },
    },
  });
}
