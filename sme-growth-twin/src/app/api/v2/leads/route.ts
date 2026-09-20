import { z } from "zod";

import { createDurableLeadRequestSchema } from "@/domain/lead-sales";
import { DurableLeadService } from "@/infrastructure/leads/durable-lead-service";
import { SupabaseDurableLeadRepository } from "@/infrastructure/leads/supabase-durable-lead-repository";
import { correlationId, errorResponse, readJson, resolveLeadAccess, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
const listSchema = z.object({ organizationId: z.uuid().optional() }).strict();

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = createDurableLeadRequestSchema.parse(await readJson(request, 32 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const receipt = await new DurableLeadService(new SupabaseDurableLeadRepository()).create(owner, input, requestId, requestId);
    const status = receipt.assignmentState === "unassigned" ? 202 : (receipt.replayed ? 200 : 201);
    return response({ data: receipt }, status, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}

export async function GET(request: Request) {
  const requestId = correlationId(request);
  try {
    const url = new URL(request.url);
    const query = listSchema.parse({ organizationId: url.searchParams.get("organizationId") ?? undefined });
    const access = await resolveLeadAccess(request, query.organizationId);
    return response({ data: await new DurableLeadService(new SupabaseDurableLeadRepository()).list(access) }, 200, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
