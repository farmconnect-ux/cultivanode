-- Buyers review the quotes sellers send to their own requests.
create policy buyer_responses_buyer_review on public.buyer_request_responses
  for update to authenticated
  using (exists (select 1 from public.buyer_requests r where r.id = request_id and r.buyer_id = (select auth.uid())))
  with check (exists (select 1 from public.buyer_requests r where r.id = request_id and r.buyer_id = (select auth.uid())));

-- Names of the people in the caller's own message threads (profiles are otherwise private).
create or replace function public.my_thread_people()
returns table (thread_id uuid, profile_id uuid, full_name text)
language sql stable security definer set search_path = ''
as $$
  select mp.thread_id, mp.profile_id, coalesce(p.full_name, 'Member')
  from public.message_participants mp
  join public.profiles p on p.id = mp.profile_id
  where mp.thread_id in (select m.thread_id from public.message_participants m where m.profile_id = (select auth.uid()));
$$;
revoke all on function public.my_thread_people() from public, anon;
grant execute on function public.my_thread_people() to authenticated;
