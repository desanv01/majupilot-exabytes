import { z } from "zod";

import { DurableLeadService } from "@/infrastructure/leads/durable-lead-service";
import { SupabaseDurableLeadRepository } from "@/infrastructure/leads/supabase-durable-lead-repository";
import { correlationId, errorResponse, resolveLeadAccess, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
const querySchema = z.object({ organizationId: z.uuid().optional(), expiresIn: z.coerce.number().int().min(30).max(900).default(300) }).strict();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const leadId = z.uuid().parse((await params).id);
    const url = new URL(request.url);
    const query = querySchema.parse({ organizationId: url.searchParams.get("organizationId") ?? undefined, expiresIn: url.searchParams.get("expiresIn") ?? undefined });
    const access = await resolveLeadAccess(request, query.organizationId);
    return response({ data: await new DurableLeadService(new SupabaseDurableLeadRepository()).reportDownload(access, leadId, query.expiresIn) }, 200, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
