import { outboxConfigurationStatus } from "@/infrastructure/outbox/outbox-worker";
import { correlationId, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = correlationId(request);
  return response({ data: {
    version: "2.0.0",
    capabilities: ["assessment", "canonical_report", "durable_lead", "transformation_copilot", "workflow_outbox"],
    delivery: outboxConfigurationStatus(),
    documentRag: "P1_not_enabled",
  } }, 200, requestId);
}
