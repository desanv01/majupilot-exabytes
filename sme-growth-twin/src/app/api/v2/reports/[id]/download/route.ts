import { z } from "zod";

import { ReportService } from "@/core/reports/report-service";
import { correlationId, errorResponse, resolveOwner, response } from "@/infrastructure/persistence/api";
import { SupabaseReportRepository } from "@/infrastructure/reports/supabase-report-repository";

export const runtime = "nodejs";
const querySchema = z.object({ organizationId: z.uuid().optional(), expiresIn: z.coerce.number().int().min(30).max(900).default(300) }).strict();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const { id } = await params;
    const reportId = z.uuid().parse(id);
    const url = new URL(request.url);
    const query = querySchema.parse({ organizationId: url.searchParams.get("organizationId") ?? undefined, expiresIn: url.searchParams.get("expiresIn") ?? undefined });
    const owner = await resolveOwner(request, query.organizationId);
    const download = await new ReportService(new SupabaseReportRepository()).signedDownload(owner, reportId, query.expiresIn);
    return response({ data: download }, 200, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
