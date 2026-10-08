-- DIT - accommodation photos for the Tanya Samui LOB
-- Apply in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xbzrtofanbrahasxbisf/sql/new

alter table accommodation_rates add column if not exists image_url text;

NOTIFY pgrst, 'reload schema';
