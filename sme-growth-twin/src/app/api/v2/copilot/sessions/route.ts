import { createCopilotSessionSchema } from "@/domain/copilot";
import { SupabaseCopilotRepository } from "@/infrastructure/copilot/supabase-copilot-repository";
import { correlationId, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";
import { copilotErrorResponse } from "@/infrastructure/copilot/copilot-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = createCopilotSessionSchema.parse(await readJson(request, 16 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const session = await new SupabaseCopilotRepository().createOrResume(owner, input);
    return response({ data: session }, 201, requestId);
  } catch (error) { return copilotErrorResponse(error, requestId); }
}
