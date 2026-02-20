-- Migration: Create storage bucket for milestone images
-- Supabase Storage bucket for uploaded photos

-- Create the storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'milestone-images',
  'milestone-images',
  true,
  5242880, -- 5MB max file size
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Public read access (images are viewable by anyone with the URL)
create policy "Public read access for milestone images"
  on storage.objects for select
  using (bucket_id = 'milestone-images');

-- Public upload access (no auth for this personal app)
create policy "Public upload access for milestone images"
  on storage.objects for insert
  with check (bucket_id = 'milestone-images');

-- Public update access
create policy "Public update access for milestone images"
  on storage.objects for update
  using (bucket_id = 'milestone-images');

-- Public delete access
create policy "Public delete access for milestone images"
  on storage.objects for delete
  using (bucket_id = 'milestone-images');
