import { PersistenceError } from "@/domain/persistence";
import { correlationId, errorResponse, response } from "@/infrastructure/persistence/api";
import { AccountCaseRepository } from "@/infrastructure/persistence/account-case-repository";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new PersistenceError("UNAUTHENTICATED", 401);
    const organizationId = await new AccountCaseRepository().ensurePersonalWorkspace(data.user.id);
    return response({ data: { organizationId } }, 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
