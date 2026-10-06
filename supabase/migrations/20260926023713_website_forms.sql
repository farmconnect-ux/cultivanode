-- CultivaNode: public website forms - marketplace waitlist and contact messages.
--
-- Visitors are not signed in, so the website calls two functions with the publishable key.
-- The tables themselves are closed to anon and authenticated users; only staff can read them.
-- The functions validate input, de-duplicate waitlist sign-ups and apply a simple rate limit.

create type public.waitlist_side as enum ('buyer', 'seller');

create table public.waitlist_signups (
  id          uuid primary key default gen_random_uuid(),
  side        public.waitlist_side not null,
  full_name   text not null check (char_length(full_name) between 2 and 120),
  phone       text check (phone is null or phone ~ '^234[0-9]{10}$'),
  email       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  state       text check (state is null or char_length(state) <= 60),
  interest    text check (interest is null or char_length(interest) <= 500),
  language    public.app_language not null default 'en',
  created_at  timestamptz not null default now(),
  constraint waitlist_has_contact check (phone is not null or email is not null)
);
create unique index waitlist_one_per_phone on public.waitlist_signups (side, phone) where phone is not null;
create unique index waitlist_one_per_email on public.waitlist_signups (side, lower(email)) where email is not null;
create index waitlist_created_idx on public.waitlist_signups (created_at desc);

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null check (char_length(full_name) between 2 and 120),
  phone       text check (phone is null or phone ~ '^234[0-9]{10}$'),
  email       text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message     text not null check (char_length(message) between 5 and 2000),
  language    public.app_language not null default 'en',
  handled_at  timestamptz,
  handled_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint contact_has_reply_path check (phone is not null or email is not null)
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);
create index contact_messages_handled_by_idx on public.contact_messages (handled_by);

alter table public.waitlist_signups enable row level security;
alter table public.contact_messages enable row level security;

create policy "waitlist: staff read" on public.waitlist_signups
  for select to authenticated using ((select public.is_admin('support_officer')));
create policy "contact: staff read" on public.contact_messages
  for select to authenticated using ((select public.is_admin('support_officer')));
create policy "contact: staff mark handled" on public.contact_messages
  for update to authenticated
  using ((select public.is_admin('support_officer')))
  with check ((select public.is_admin('support_officer')));

revoke all on public.waitlist_signups, public.contact_messages from anon, authenticated;
grant select on public.waitlist_signups to authenticated;
grant select, update (handled_at, handled_by) on public.contact_messages to authenticated;

------------------------------------------------------------------------------------------------
-- Input helpers (private: not exposed through the API)
------------------------------------------------------------------------------------------------

-- Nigerian phone numbers to 234XXXXXXXXXX. Accepts 0803..., +234 803..., 234803..., with spaces or dashes.
create or replace function private.normalize_ng_phone(p_phone text)
returns text
language sql immutable
set search_path = ''
as $$
  select case
    when d is null or d = '' then null
    when d ~ '^0[0-9]{10}$'    then '234' || substr(d, 2)
    when d ~ '^234[0-9]{10}$'  then d
    when d ~ '^[789][01][0-9]{8}$' then '234' || d
    else 'invalid'
  end
  from (select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as d) x;
$$;

------------------------------------------------------------------------------------------------
-- Public functions called by the website
------------------------------------------------------------------------------------------------

create or replace function public.join_waitlist(
  p_side      public.waitlist_side,
  p_full_name text,
  p_phone     text default null,
  p_email     text default null,
  p_state     text default null,
  p_interest  text default null,
  p_language  public.app_language default 'en'
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_phone text := private.normalize_ng_phone(p_phone);
  v_email text := nullif(lower(trim(p_email)), '');
begin
  if v_phone = 'invalid' then
    raise exception 'Enter a Nigerian phone number, for example 0803 123 4567.' using errcode = '22023';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'Give us a phone number or an email address.' using errcode = '22023';
  end if;
  if (select count(*) from public.waitlist_signups where created_at > now() - interval '1 minute') > 30 then
    raise exception 'Too many sign-ups right now. Please try again in a minute.' using errcode = '54000';
  end if;

  insert into public.waitlist_signups (side, full_name, phone, email, state, interest, language)
  values (p_side, trim(p_full_name), v_phone, v_email, nullif(trim(p_state), ''), nullif(trim(p_interest), ''),
          coalesce(p_language, 'en'))
  on conflict do nothing;  -- already on the list: succeed quietly
end;
$$;

create or replace function public.send_contact_message(
  p_full_name text,
  p_message   text,
  p_phone     text default null,
  p_email     text default null,
  p_language  public.app_language default 'en'
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_phone text := private.normalize_ng_phone(p_phone);
  v_email text := nullif(lower(trim(p_email)), '');
begin
  if v_phone = 'invalid' then
    raise exception 'Enter a Nigerian phone number, for example 0803 123 4567.' using errcode = '22023';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'Give us a phone number or an email address so we can reply.' using errcode = '22023';
  end if;
  if (
    select count(*) from public.contact_messages
     where created_at > now() - interval '1 hour'
       and ((v_phone is not null and phone = v_phone) or (v_email is not null and email = v_email))
  ) >= 5 then
    raise exception 'You have sent several messages recently. We will reply soon.' using errcode = '54000';
  end if;

  insert into public.contact_messages (full_name, phone, email, message, language)
  values (trim(p_full_name), v_phone, v_email, trim(p_message), coalesce(p_language, 'en'));
end;
$$;

revoke execute on function private.normalize_ng_phone(text) from public, anon, authenticated;
revoke execute on function
  public.join_waitlist(public.waitlist_side, text, text, text, text, text, public.app_language),
  public.send_contact_message(text, text, text, text, public.app_language)
  from public;
grant execute on function
  public.join_waitlist(public.waitlist_side, text, text, text, text, text, public.app_language),
  public.send_contact_message(text, text, text, text, public.app_language)
  to anon, authenticated;
