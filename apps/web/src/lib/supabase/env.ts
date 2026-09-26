export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase settings. Copy apps/web/.env.example to apps/web/.env.local and fill in the URL and publishable key.",
    );
  }
  return { url, key };
}
