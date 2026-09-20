import { z } from "zod";

import { SupabaseConsultantNoteRepository } from "@/infrastructure/consultant-notes/supabase-consultant-note-repository";
import { correlationId, errorResponse, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
const querySchema = z.object({ organizationId: z.uuid(), assessmentSessionId: z.uuid() }).strict();

export async function GET(request: Request) {
  const requestId = correlationId(request);
  try {
    const url = new URL(request.url);
    const query = querySchema.parse({ organizationId: url.searchParams.get("organizationId"), assessmentSessionId: url.searchParams.get("assessmentSessionId") });
    const owner = await resolveOwner(request, query.organizationId);
    const notes = await new SupabaseConsultantNoteRepository().list(owner, query.assessmentSessionId);
    return response({ data: notes }, 200, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
