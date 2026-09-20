import "server-only";

import { createHash } from "node:crypto";

import { canonicalJson } from "@/core/reports/canonical-json";
import {
  createDurableLeadRequestSchema,
  leadAssignmentViewSchema,
  leadEventViewSchema,
  leadReportDownloadSchema,
  leadReceiptSchemaV2,
  leadSummaryV2Schema,
  salespersonLeadDetailSchema,
} from "@/domain/lead-sales";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import type { DurableLeadRepository, LeadAccessContext } from "./durable-lead-repository";

export class DurableLeadService {
  constructor(private readonly repository: DurableLeadRepository) {}

  async create(owner: OwnershipContext, raw: unknown, requestId: string, correlationId: string) {
    const request = createDurableLeadRequestSchema.parse(raw);
    const context = await this.repository.loadCreateContext(owner, request);
    const requestHash = createHash("sha256").update(canonicalJson({ version: "phase-f-create-1.0.0", request, capabilityTags: [...context.capabilityTags].sort() })).digest("hex");
    return leadReceiptSchemaV2.parse(await this.repository.create(owner, request, requestHash, requestId, correlationId, context));
  }

  async list(access: LeadAccessContext) { return (await this.repository.list(access)).map((item) => leadSummaryV2Schema.parse(item)); }
  async detail(access: LeadAccessContext, leadId: string) { return salespersonLeadDetailSchema.parse(await this.repository.detail(access, leadId)); }
  async assignment(access: LeadAccessContext, leadId: string) { return leadAssignmentViewSchema.parse(await this.repository.assignment(access, leadId)); }
  async events(access: LeadAccessContext, leadId: string) { return (await this.repository.events(access, leadId)).map((item) => leadEventViewSchema.parse(item)); }
  async reportDownload(access: LeadAccessContext, leadId: string, expiresInSeconds = 300) {
    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 30 || expiresInSeconds > 900) throw new PersistenceError("VALIDATION_FAILED", 422);
    return leadReportDownloadSchema.parse(await this.repository.reportDownload(access, leadId, expiresInSeconds));
  }
}
