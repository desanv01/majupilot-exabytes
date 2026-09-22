import { z } from "zod";

import { copilotTurnRequestSchema } from "@/domain/copilot";
import { executeCopilotTurn } from "@/infrastructure/copilot/copilot-model";
import { SupabaseCopilotRepository } from "@/infrastructure/copilot/supabase-copilot-repository";
import { correlationId, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";
import { copilotErrorResponse } from "@/infrastructure/copilot/copilot-errors";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const sessionId = z.uuid().parse((await params).id);
    const input = copilotTurnRequestSchema.parse(await readJson(request, 24 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
    const data = await executeCopilotTurn({ owner, sessionId, request: input, repository: new SupabaseCopilotRepository(), clientKey });
    return response({ data }, 200, requestId);
  } catch (error) {
    return copilotErrorResponse(error, requestId);
  }
}
