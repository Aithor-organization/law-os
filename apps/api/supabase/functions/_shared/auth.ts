// Validate Supabase JWT from the `Authorization: Bearer <token>` header.
// Returns the authenticated user id or throws.
//
// Local `supabase functions serve` reserves env names starting with `SUPABASE_`,
// so for local hybrid development we prefer custom names and fall back to the
// standard names for deployed environments.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.1";

function getProjectSupabaseEnv() {
  const supabaseUrl =
    Deno.env.get("LAWOS_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get("LAWOS_SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY");

  return { supabaseUrl, anonKey };
}

export async function getAuthenticatedUser(req: Request): Promise<{
  userId: string;
  email: string | null;
}> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "missing_authorization" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const token = authHeader.slice("Bearer ".length);

  const { supabaseUrl, anonKey } = getProjectSupabaseEnv();
  if (!supabaseUrl || !anonKey) {
    throw new Response(
      JSON.stringify({
        error: "server_misconfigured",
        detail: "Missing LAWOS_SUPABASE_URL / LAWOS_SUPABASE_ANON_KEY",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const client = createClient(supabaseUrl, anonKey);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    throw new Response(
      JSON.stringify({
        error: "invalid_token",
        detail: error?.message ?? "No authenticated user returned",
      }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return { userId: data.user.id, email: data.user.email ?? null };
}
