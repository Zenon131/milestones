-- Migration: Increase file size limit to 100MB
update storage.buckets
set file_size_limit = 104857600 -- 100MB
where id = 'milestone-images';
