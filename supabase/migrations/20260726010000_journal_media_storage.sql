-- Storage bucket for journal entry images/videos. Public read (URLs are
-- unguessable UUIDs, embedded directly in Tiptap document JSON — no signed
-- URL management needed for MVP), writes restricted to the owning user via
-- the top-level folder in the object path (`{user_id}/...`).
insert into storage.buckets (id, name, public)
values ('journal-media', 'journal-media', true)
on conflict (id) do nothing;

create policy "Public read access to journal media"
on storage.objects for select
using (bucket_id = 'journal-media');

create policy "Users upload journal media into their own folder"
on storage.objects for insert
with check (
  bucket_id = 'journal-media'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);

create policy "Users update their own journal media"
on storage.objects for update
using (
  bucket_id = 'journal-media'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);

create policy "Users delete their own journal media"
on storage.objects for delete
using (
  bucket_id = 'journal-media'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);
