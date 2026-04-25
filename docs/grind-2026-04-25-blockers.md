# 2026-04-25 daytime grind — deferred items

## Photo upload on `/list-your-camp` (Item 3.5)

The accordion exposes every other optional field — sessions, social handles,
scholarships, accommodations, testimonials — but the photo-upload picker
was deferred. Two reasons:

1. **No `camp-submissions` Supabase Storage bucket exists.** The agent
   doesn't have prod admin access (Noah's dad applies migrations and owns
   the Supabase dashboard). Bucket creation, RLS policy wiring, and
   public-read configuration all need to happen via the dashboard before
   the upload endpoint can succeed.
2. **No prior storage usage in the codebase.** Wiring `getSignedUploadUrl`,
   client-side multi-file picker, drag-and-drop fallback, thumbnails,
   per-file progress + error states, and a `/api/camp-uploads/sign` route
   would have blown the >1h stop-and-defer cap on its own.

The form already shows a friendly fallback inside the accordion: "📷 Photo
upload coming next week — we're finalizing storage. Email
hi@schoolsout.net any photos and we'll attach them to your listing." That
preserves intent (operators who care about photos still reach us) without
shipping a half-finished pipeline.

The API route accepts `photo_urls: string[]` (zod-validated as URLs,
≤5 entries) so the field is wire-compatible the moment the upload UI lands.

### What Noah's dad needs to do before the photo UI ships

1. In the Supabase dashboard → Storage → New bucket: name `camp-submissions`,
   public read OFF (operators upload pre-approval; admin downloads later).
2. Add a service-role-only INSERT/SELECT policy.
3. Confirm the bucket name + path layout (`{application_id}/photos/`) is
   what we want (the agent assumed this from the plan; happy to change).

Once that's done, a follow-up commit can wire:
- `src/lib/uploads.ts` with `getSignedUploadUrl(applicationId, filename)`.
- A `/api/camp-uploads/sign` server action.
- The actual file picker UI inside the accordion (drag-and-drop, thumbnails,
  remove ×, 5MB / 5-file caps).
