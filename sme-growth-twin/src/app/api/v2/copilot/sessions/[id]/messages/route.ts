import { z } from "zod";

import { SupabaseCopilotRepository } from "@/infrastructure/copilot/supabase-copilot-repository";
import { correlationId, resolveOwner, response } from "@/infrastructure/persistence/api";
import { copilotErrorResponse } from "@/infrastructure/copilot/copilot-errors";

export const runtime = "nodejs";
const querySchema = z.object({ organizationId: z.uuid().optional(), after: z.coerce.number().int().min(0).default(0), limit: z.coerce.number().int().min(1).max(200).default(100) }).strict();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const sessionId = z.uuid().parse((await params).id);
    const url = new URL(request.url);
    const query = querySchema.parse({ organizationId: url.searchParams.get("organizationId") ?? undefined, after: url.searchParams.get("after") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    const owner = await resolveOwner(request, query.organizationId);
    const repository = new SupabaseCopilotRepository();
    const [session, messages] = await Promise.all([repository.getSession(owner, sessionId), repository.history(owner, sessionId, query.after, query.limit)]);
    return response({ data: { session, messages } }, 200, requestId);
  } catch (error) { return copilotErrorResponse(error, requestId); }
}
