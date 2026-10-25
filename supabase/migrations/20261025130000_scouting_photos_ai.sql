-- Scouting photos and AI photo analysis.
--
-- Farmers attach photos to a scouting observation (website or app). Photos are private: they live in the
-- "scouting-photos" bucket under {user id}/{observation id}/…, and only the person who took them can read or
-- delete them (pages show them through short-lived signed links). When the admin switch ai_photo_diagnosis is
-- on, the server sends the photos to the AI model and stores its suggestion on the observation. The result is
-- advice for the farmer to check, never an automatic action.

alter table public.crop_observations
  add column if not exists ai_diagnosis jsonb,
  add column if not exists ai_model text,
  add column if not exists ai_analysed_at timestamptz;

comment on column public.crop_observations.ai_diagnosis is
  'AI suggestion from the photos: {summary, likely:[{name, confidence, why}], checks[], actions[], urgent, see_expert_if, safety[]}. Advice only.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scouting-photos', 'scouting-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "scouting photos: owners upload" on storage.objects;
create policy "scouting photos: owners upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'scouting-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "scouting photos: owners read" on storage.objects;
create policy "scouting photos: owners read" on storage.objects for select to authenticated
  using (bucket_id = 'scouting-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "scouting photos: owners delete" on storage.objects;
create policy "scouting photos: owners delete" on storage.objects for delete to authenticated
  using (bucket_id = 'scouting-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
