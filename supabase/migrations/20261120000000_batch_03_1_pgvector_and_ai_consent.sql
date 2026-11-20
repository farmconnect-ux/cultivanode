-- Batch 03.1B M1: pgvector and AI intelligence consent foundation.
-- This migration only installs the vector type and adds the consent enum label.
-- Do not reference the new enum label in DML until this migration has committed.

create extension if not exists vector with schema extensions;

alter type public.consent_type
  add value if not exists 'ai_intelligence';
