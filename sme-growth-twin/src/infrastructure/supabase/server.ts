import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "./env";

export async function createServerSupabaseClient() {
  const env = getPublicSupabaseEnv(); const store = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll: () => store.getAll(), setAll: values => { for (const item of values) store.set(item.name, item.value, item.options); } },
  });
}
