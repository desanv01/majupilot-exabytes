import { z } from "zod";

import { ReportService } from "@/core/reports/report-service";
import { generateReportRequestSchema } from "@/domain/reports";
import { correlationId, errorResponse, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";
import { SupabaseReportRepository } from "@/infrastructure/reports/supabase-report-repository";

export const runtime = "nodejs";
const listQuerySchema = z.object({ organizationId: z.uuid().optional(), assessmentSessionId: z.uuid() }).strict();

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = generateReportRequestSchema.parse(await readJson(request, 32 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const report = await new ReportService(new SupabaseReportRepository()).generate(owner, input, requestId);
    return response({ data: report }, report.status === "completed" ? 201 : 202, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
export async function GET(request: Request) {
  const requestId = correlationId(request);
  try {
    const url = new URL(request.url);
    const input = listQuerySchema.parse({ organizationId: url.searchParams.get("organizationId") ?? undefined, assessmentSessionId: url.searchParams.get("assessmentSessionId") });
    const owner = await resolveOwner(request, input.organizationId);
    const reports = await new ReportService(new SupabaseReportRepository()).list(owner, input.assessmentSessionId);
    return response({ data: reports }, 200, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
