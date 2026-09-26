# Offline sync (mobile)

**Status: not built (milestone M7).** The mobile app currently needs a connection.

## Rules for the build
- Engine: PowerSync or WatermelonDB (decide in M7 after a spike on low-end Android).
- Offline-capable records: farms, plots, plantings, operation logs, inventory records, field visits.
- Every offline mutation carries `local_id`, `server_id`, `sync_status`, `created_at`, `updated_at`,
  `device_id`. Conflicts resolve deterministically (documented per table).
- Server-side RLS and validation still apply when changes upload; the server is the source of truth.
- Financial operations are never shown as complete while offline.
