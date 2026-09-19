import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabaseEnv } from "./env";

export function createAdminSupabaseClient() {
  const env = getServerSupabaseEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}
