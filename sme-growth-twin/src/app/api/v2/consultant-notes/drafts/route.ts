import { AiExecutionError } from "@/domain/ai-execution";
import { consultantNoteDraftRequestSchema } from "@/domain/consultant-notes";
import { SupabaseConsultantNoteRepository } from "@/infrastructure/consultant-notes/supabase-consultant-note-repository";
import { runConsultantNoteDraft } from "@/infrastructure/model-provider/consultant-note-model";
import { correlationId, errorResponse, readJson, repository, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = consultantNoteDraftRequestSchema.parse(await readJson(request, 32 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
    const result = await runConsultantNoteDraft(input, owner, new SupabaseConsultantNoteRepository(), repository(), clientKey);
    return response({ data: result }, result.note ? 201 : 200, requestId);
  } catch (error) {
    if (error instanceof AiExecutionError) return response({ error: { code: error.code, requestId, retryable: error.retryable } }, error.httpStatus, requestId);
    return errorResponse(error, requestId);
  }
}
