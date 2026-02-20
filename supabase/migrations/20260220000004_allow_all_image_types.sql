-- Migration: Allow all image mime types in storage bucket
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/svg+xml']
where id = 'milestone-images';
