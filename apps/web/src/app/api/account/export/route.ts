import { createClient } from "@/lib/supabase/server";

// "Download my data" (NDPA): everything the platform holds about the signed-in person, as JSON.
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Sign in first.", { status: 401, headers: { "Cache-Control": "no-store" } });
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return new Response("Could not prepare your data. Please try again.", { status: 500, headers: { "Cache-Control": "no-store" } });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-data-${day}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
