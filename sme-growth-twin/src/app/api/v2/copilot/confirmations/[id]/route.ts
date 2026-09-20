import { z } from "zod";

import { confirmCopilotToolSchema } from "@/domain/copilot";
import { AiExecutionError } from "@/domain/ai-execution";
import { CopilotWriteExecutor } from "@/infrastructure/copilot/copilot-write-executor";
import { SupabaseCopilotRepository } from "@/infrastructure/copilot/supabase-copilot-repository";
import { correlationId, errorResponse, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const confirmationId = z.uuid().parse((await params).id);
    const input = confirmCopilotToolSchema.parse(await readJson(request, 8 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
    const repository = new SupabaseCopilotRepository();
    const confirmation = await new CopilotWriteExecutor(repository).execute(owner, confirmationId, input.idempotencyKey, clientKey);
    return response({ data: confirmation }, 200, requestId);
  } catch (error) {
    if (error instanceof AiExecutionError) return response({ error: { code: error.code, requestId, retryable: error.retryable } }, error.httpStatus, requestId);
    return errorResponse(error, requestId);
  }
}
