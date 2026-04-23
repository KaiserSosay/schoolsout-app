import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// Stub for Goal 4 (Stripe deferred). Returns 503 until STRIPE_SECRET_KEY +
// STRIPE_FEATURED_PRICE_ID are set. Goal 4 replaces this implementation
// with real Stripe Checkout session creation.
export async function POST() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_FEATURED_PRICE_ID) {
    return NextResponse.json(
      {
        error: 'stripe_not_configured',
        detail:
          'Ask Rasheid to complete the 5-step Stripe prereq checklist before Goal 4 ships.',
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: 'not_implemented', detail: 'Goal 4 implements Stripe Checkout wiring.' },
    { status: 501 },
  );
}
