# Batch 03.1B M5: AI Prompt Version Governance

## Decision

Prompt content is stored as immutable, versioned records. A separate active pointer selects the version used by runtime consumers. Activation and rollback are transactional, serialised per prompt key, and recorded in both the dedicated activation history and the existing append-only audit log.

## Data model

- `private.ai_prompt_versions`: immutable prompt content, SHA-256 digest, bounded metadata, unique prompt-key/version pair, and pseudonymous actor attribution.
- `private.ai_prompt_active_pointers`: one active version per prompt key, with a composite foreign key ensuring the selected version belongs to that key.
- `private.ai_prompt_activation_history`: append-only activation and rollback history with a required reason and pseudonymous actor attribution.
- `private.ai_prompt_version_validations`: append-only, one record per version, holding the evaluation evidence that clears the version for activation.

M5 applies before M3 (`20261120015000`), so `public.ai_audit_events.prompt_version_id` can reference a registered version.

All tables have RLS enabled and no direct privileges for application roles. Prompt content and actor attribution are not exposed through direct table access.

## Operations

- `public.create_ai_prompt_version`: authenticated management RPC, validates key/version/content/metadata, computes the digest server-side, and records creation in `public.audit_log`.
- `public.validate_ai_prompt_version`: authenticated management RPC, requires `ai.manage`, records evaluation evidence once per version, and writes `ai_prompt_version_validated` to `public.audit_log`.
- `public.set_active_ai_prompt_version`: authenticated management RPC, requires `ai.manage`, serialises by prompt key, verifies the immutable target exists and has been validated (`55000` otherwise), updates the pointer, and records reason/history/audit in one transaction.
- `public.rollback_active_ai_prompt_version`: authenticated management RPC, requires `ai.manage`, serialises by prompt key, selects the previous validated version from activation history, restores its pointer, and records rollback reason/history/audit transactionally.
- `public.list_ai_prompt_versions`, `public.get_ai_prompt_version`, `public.list_ai_prompt_activation_history`: `ai.manage`-gated reads for a future admin prompt-management screen.
- `public.get_active_ai_prompt(text)`: PostgreSQL-owned `SECURITY DEFINER` function with `SET search_path = ''` and `EXECUTE` privileges restricted exclusively to `service_role` (`PUBLIC`, `anon`, and `authenticated` revoked). Runtime can resolve the active prompt by explicit key without directly reading or mutating `private.ai_prompt_*` tables.

M5 registers `ai.manage` in `public.permissions` but does not grant it to any admin sub-role, so it currently resolves through the super-admin bypass only.

## Deletion and privacy

Prompt creator, activator and rollback attribution uses `private.ai_actor_directory.actor_subject_id`, not profile foreign keys. Account deletion therefore anonymises attribution through the existing actor-directory hook without blocking deletion or retaining direct profile references in prompt governance tables.

The existing `public.audit_log` records the authenticated profile as required by its current schema and retention policy. Its existing account-deletion treatment remains authoritative.

## Security controls

- SECURITY DEFINER functions are PostgreSQL-owned and set an empty search_path.
- Prompt versions and activation history reject UPDATE and DELETE through immutable triggers.
- Prompt content digest is computed by the database and checked by a constraint.
- Activation/rollback uses a transaction-scoped advisory lock scoped to the prompt key.
- Prompt key, version, content length, metadata shape/size and reason are validated.
- Direct table access is revoked from PUBLIC, anon, authenticated and service_role.
- Management RPCs require an active authenticated account and `ai.manage`.
- Runtime content retrieval is limited to service_role through a narrow read function.

## Operational boundary

M5 is database governance only. It does not change any active prompt, enable a prompt-management UI, modify environment variables, or deploy application code. The initial active-pointer table is empty, so no prompt becomes active automatically. Hosted Staging application requires separate explicit authorisation after complete CI verification.
