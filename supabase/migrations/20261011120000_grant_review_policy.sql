-- Programme owners review applications to their own grant programmes (score, shortlist, award, decline).
create policy grant_applications_programme_owner_review on public.grant_applications
  for update to authenticated
  using (exists (select 1 from public.grant_programmes g where g.id = programme_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.grant_programmes g where g.id = programme_id and g.owner_id = (select auth.uid())));
