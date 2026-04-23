import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

// Stub for Goal 4 (Stripe deferred). Returns 503 until STRIPE_SECRET_KEY +
// STRIPE_FEATURED_PRICE_ID are set. Goal 4 replaces this implementation
// with real Stripe Checkout session creation.
export async function POST() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

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
