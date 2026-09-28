# Integrations (switchable providers)

SMS and identity-check providers are chosen, configured and switched by staff in the admin console
(`/admin/integrations`), not in code or environment variables. Staff need the `integrations.manage`
permission (super admins have it).

## How it fits together

```
Admin console (web)                     Database (Supabase)                       Edge Functions
/admin/integrations  --server actions-->  admin_* functions (integrations.manage)
                                          integration_settings   active provider per kind
                                          integration_configs    test/live settings, current mode
                                          integration_secrets -> Supabase Vault (encrypted keys)
Supabase Auth --Send SMS hook----------------------------------------------------> send-sms
Booking changes -> sms_outbox <- pg_cron wakes every minute (pg_net, Vault secret) -> send-notifications
Apps (NIN/BVN/bank) ----------------------------------------------------------------> verify-identity
"Send test" button --------------------------------------------------------------> integration-test
                                          integration_runtime(kind)  <-- service role only
                                          integration_events (no personal data) <-- every call
```

- **Kinds:** `sms` (sign-in codes and booking messages) and `identity` (NIN, BVN, payout bank account).
- **Providers today:** Termii and Twilio (SMS), Prembly (identity), plus test providers `mock_sms` and
  `mock_identity`. Dojah and Smile ID are listed but not built; they cannot be activated.
- **Test and live** keep separate settings and separate keys. Saving live settings never switches the
  mode; the "Switch to live" button does, and it refuses while the target mode is missing a key.
- **Activation** refuses a provider that is not built or is missing a required setting or key.
- **Keys** go straight into Supabase Vault. The admin page shows only "saved, ends in 1234" and the date;
  no app role can read the key tables, and the audit log records field names, never values.
- **Test providers** are refused by the Edge Functions when the secret `APP_ENV=production` is set.
- **Health:** each provider call writes a row to `integration_events` (kind, provider, mode, operation,
  success, HTTP status, error code, duration). Phone numbers, codes and ID numbers are never logged.

## Twilio (SMS)

- Settings: **Account SID** (starts `AC`), **Sender** and the sign-in message; key: **Auth token**.
- Sender can be a Twilio number (`+1...`), an alphanumeric sender ID registered for Nigeria with Twilio, or a
  Messaging Service SID (`MG...`, Twilio then picks the sender). Nigerian networks filter unregistered senders,
  so register the sender ID with Twilio before going live.
- **Test mode** takes Twilio's *test* Account SID and token: Twilio checks the request but sends and charges
  nothing (use Twilio's magic test numbers to see success and failure). Live mode takes the real ones.
- Errors: an account with no balance (Twilio 10001/20005/30002) shows as `billing`; rate limits and outages as
  `unavailable` (booking SMS are retried); everything else as `rejected`. Only Twilio's numeric code is kept,
  never its message text (it can repeat the phone number).

## Booking SMS (send-notifications)

1. The booking functions queue a row in `sms_outbox` (kind, booking, facts such as title, date and first name;
   no phone number, no price, no reason) next to the in-app notification.
2. Every minute `pg_cron` runs `private.wake_notify_worker()`: if messages are due, it calls the
   `send-notifications` Edge Function through `pg_net` with the `x-worker-secret` header (Vault
   `notify_worker_secret`, created by the migration). The function checks it with `notify_worker_authorized()`.
3. The worker claims up to 20 messages, words each in the recipient's language (`_shared/booking-sms.ts`,
   English or Yorùbá, under 160 characters in English), sends it through the active SMS provider and records
   the result. Provider down or wallet empty: retried after 5 and 10 minutes (3 attempts). Suspended accounts
   and people without a phone are skipped. No working provider: nothing is claimed, the queue waits.
4. Health rows use operation `booking_sms`. Admin overview numbers: `admin_booking_stats()`.

## Identity checks (verify-identity)

1. The user must be signed in, have a name on their profile and have granted `data_processing` consent.
2. At most 5 attempts per person per day (checks cost money); a second NIN/BVN check after success is refused.
3. The active provider answers; the name it returns is compared with the profile name
   (order-independent, tone marks ignored, one-letter typos forgiven in long names).
4. Stored: masked number (`*******8901`), an HMAC fingerprint (key in Vault) to catch one ID on two
   accounts, the name-match score and the outcome. The provider's full response is discarded.
5. The verification tier updates automatically (NIN -> 1; NIN + BVN + verified bank account -> 2).

## Adding a provider

1. Write an adapter in `supabase/functions/_shared/providers/sms.ts` or `identity.ts` that implements
   the `SmsProvider` / `IdentityProvider` interface, register it in `smsProvider()` / `identityProvider()`,
   and add unit tests in `supabase/functions/_shared/__tests__/`.
2. Add a migration that inserts (or updates) its row in `public.integration_providers` with
   `implemented = true`, its `config_fields` (non-secret settings, with defaults) and `secret_fields` (keys).
3. Deploy the Edge Functions. Staff can then configure and switch to it in the admin console.

## One-time setup on the hosted project

See DEPLOYMENT.md, "Sign-in codes and identity checks".
