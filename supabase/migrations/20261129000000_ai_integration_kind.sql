-- New integration kind for the AI model providers (Claude, Gemini, OpenAI). Added on its own because a new
-- enum value cannot be used in the same transaction that adds it.
alter type public.integration_kind add value if not exists 'ai';
