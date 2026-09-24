import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
import { correlationId, errorResponse, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const client = await createServerSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return response({ data: { signedOut: true } }, 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
