-- ============================================================
-- DIT - accommodation room/villa photos
-- Apply in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xbzrtofanbrahasxbisf/sql/new
-- ============================================================

alter table accommodation_rates add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'accommodation-photos',
  'accommodation-photos',
  true,
  5242880,                        -- 5 MB
  array['image/jpeg','image/png','image/webp','image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

