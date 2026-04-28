-- Phase 4.x — Supabase Storage buckets for camp images.
--
-- Two buckets:
--   - 'camp-logos'  : square logos (~256x256), 512 KB max, png/jpeg/webp/svg
--   - 'camp-heroes' : 16:9 hero/cover images (~1200x675), 2 MB max, png/jpeg/webp
--
-- Both are PUBLIC-READ so the rendered camp pages can `<img src=...>`
-- without a signed URL handshake. Writes are restricted to the service
-- role (admin uploads only) — parents and operators can't upload.
--
-- NOT applied tonight. Rasheid applies after migration 054 in the morning.
--
-- Idempotency notes:
--   - Bucket INSERTs use ON CONFLICT (id) DO NOTHING — same pattern as
--     migration 012 (school-calendars bucket).
--   - Policies use DROP POLICY IF EXISTS ... CREATE POLICY because
--     Postgres CREATE POLICY does NOT support IF NOT EXISTS reliably
--     across the versions Supabase ships.
--
-- This migration must run after the user has rights on storage.objects
-- (true for the postgres / service-role roles the supabase CLI uses).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('camp-logos', 'camp-logos', true, 524288,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('camp-heroes', 'camp-heroes', true, 2097152,
    ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public read on both buckets.
DROP POLICY IF EXISTS "Public read on camp-logos" ON storage.objects;
CREATE POLICY "Public read on camp-logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'camp-logos');

DROP POLICY IF EXISTS "Public read on camp-heroes" ON storage.objects;
CREATE POLICY "Public read on camp-heroes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'camp-heroes');

-- Service-role-only writes. The auth.role() function returns
-- 'service_role' when the request is authenticated with the service
-- role JWT — that's the gate for admin uploads.
DROP POLICY IF EXISTS "Service role insert on camp-logos" ON storage.objects;
CREATE POLICY "Service role insert on camp-logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'camp-logos' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role insert on camp-heroes" ON storage.objects;
CREATE POLICY "Service role insert on camp-heroes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'camp-heroes' AND auth.role() = 'service_role');

-- Service-role-only updates (admin replaces an existing image).
DROP POLICY IF EXISTS "Service role update on camp-logos" ON storage.objects;
CREATE POLICY "Service role update on camp-logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'camp-logos' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role update on camp-heroes" ON storage.objects;
CREATE POLICY "Service role update on camp-heroes"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'camp-heroes' AND auth.role() = 'service_role');

-- Service-role-only deletes (admin removes an image).
DROP POLICY IF EXISTS "Service role delete on camp-logos" ON storage.objects;
CREATE POLICY "Service role delete on camp-logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'camp-logos' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role delete on camp-heroes" ON storage.objects;
CREATE POLICY "Service role delete on camp-heroes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'camp-heroes' AND auth.role() = 'service_role');
