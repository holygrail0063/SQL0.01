import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type ApiAuthResult =
  | { user: User; supabase: SupabaseClient; error?: never; status?: never }
  | { user?: never; supabase?: never; error: string; status: number };

export async function requireVerifiedApiUser(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: "Please log in before using QueryRight.", status: 401 };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return { error: "Supabase is not configured for this environment.", status: 500 };

  const supabase = createAuthenticatedSupabaseClient(supabaseUrl, supabaseKey, token);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: "Please log in before using QueryRight.", status: 401 };
  if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
    return { error: "Please verify your email before using QueryRight.", status: 403 };
  }

  return { user: data.user, supabase };
}

export function createAuthenticatedSupabaseClient(supabaseUrl: string, supabaseKey: string, token: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
