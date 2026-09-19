import { consultantNoteAcceptanceRequestSchema } from "@/domain/consultant-notes";
import { SupabaseConsultantNoteRepository } from "@/infrastructure/consultant-notes/supabase-consultant-note-repository";
import { correlationId, errorResponse, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = consultantNoteAcceptanceRequestSchema.parse(await readJson(request, 24 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const note = await new SupabaseConsultantNoteRepository().acceptDraft(owner, input);
    return response({ data: note }, 201, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
