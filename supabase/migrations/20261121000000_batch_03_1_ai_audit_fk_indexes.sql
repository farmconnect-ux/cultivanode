-- Batch 03.1B follow-up: cover the two AI audit foreign keys that grow with AI traffic.
-- prompt_version_id is null for prompts not yet registered, so its index is partial.

create index ai_audit_events_prompt_version_idx
  on public.ai_audit_events (prompt_version_id)
  where prompt_version_id is not null;

create index ai_audit_feedback_actor_subject_idx
  on public.ai_audit_feedback (actor_subject_id);
