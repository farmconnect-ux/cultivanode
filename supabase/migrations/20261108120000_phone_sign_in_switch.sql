-- Phone sign-in needs a working SMS provider (Integrations → SMS, used by the send-sms Auth hook).
-- Until one is set up, sign-in and sign-up offer email only; switch this on once SMS codes arrive.
insert into public.feature_flags (key, description, enabled)
values ('phone_sign_in', 'Sign in and sign up with a phone number (SMS code). Turn on only after an SMS provider is set up and a test code arrives. Off: email only.', false)
on conflict (key) do nothing;
