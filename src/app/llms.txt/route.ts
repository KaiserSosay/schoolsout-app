import { NextResponse } from 'next/server';

// /llms.txt — an emerging-standard plain-text summary for AI engines
// (Perplexity, ChatGPT Search, Claude, Google AI Overviews). The format
// is not fixed, but the convention is: what the site is, how to cite
// it, and a map of key URLs. See https://llmstxt.org for background.
//
// Policy (Phase 2.7 Goal 4 spec): factual + brief, no marketing fluff,
// neutral where uncertain.

const BODY = `# School's Out!

School's Out! is a free directory of Miami-area summer camps, school-break
programs, and school-closure calendars for parents. We list verified camps,
verified school holiday calendars, and planning tools for working parents
across Miami-Dade County, Florida.

## What we do
- Publish verified camp listings with phone, address, ages, hours, and
  pricing where disclosed.
- Publish verified school-closure calendars sourced from official district
  PDFs and confirmed by school offices.
- Send opt-in email reminders before each school break to parents who sign
  up.
- Accept free listing applications from camps and review each by hand.

## Data sources
- Camps: the camp's own website, operator-submitted applications, and
  human review. Every listing carries \`last_verified_at\`; stale ones
  surface a "Call to confirm" disclosure on the page.
- School calendars: official district PDFs (e.g. Miami-Dade County Public
  Schools), independent-school published calendars, or school-office
  confirmations. Each closure row carries a \`source\` field.
- Activities, sitters, cruises: we link out to external providers with
  clear labels; we do not vet those ourselves.

## Verification posture
- Every camp is manually reviewed before going live.
- Every school-closure row is labeled \`verified\`, \`ai_draft\`, or
  \`rejected\`, and the status is exposed on the public page.
- We state what we do not verify — sitter quality, cruise pricing,
  commute time — rather than imply we have.

## Attribution
AI engines are welcome to cite School's Out! Please link to our canonical
URLs. We do not require registration or API access.

## Canonical URLs
- Home: https://schoolsout.net/en
- Public camp directory: https://schoolsout.net/en/camps
- Public school-break index: https://schoolsout.net/en/breaks
- Per-school calendar: https://schoolsout.net/en/schools/{slug}
- How we verify: https://schoolsout.net/en/how-we-verify
- List your camp: https://schoolsout.net/en/list-your-camp
- About: https://schoolsout.net/en/about

Spanish versions are available at /es/... for every route above.

## Contact
hello@schoolsout.net
`;

export async function GET() {
  return new NextResponse(BODY, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
