import type { OwnershipContext } from "@/domain/persistence";
import type { CreateDurableLeadRequest, LeadAssignmentView, LeadEventView, LeadReceiptV2, LeadReportDownload, LeadSummaryV2, SalespersonLeadDetail } from "@/domain/lead-sales";

export type LeadAccessContext = OwnershipContext | { kind: "staff"; userId: string };

export interface DurableLeadCreateContext {
  capabilityTags: string[];
}

export interface DurableLeadRepository {
  loadCreateContext(owner: OwnershipContext, request: CreateDurableLeadRequest): Promise<DurableLeadCreateContext>;
  create(owner: OwnershipContext, request: CreateDurableLeadRequest, requestHash: string, requestId: string, correlationId: string, context: DurableLeadCreateContext): Promise<LeadReceiptV2>;
  list(access: LeadAccessContext): Promise<LeadSummaryV2[]>;
  detail(access: LeadAccessContext, leadId: string): Promise<SalespersonLeadDetail>;
  assignment(access: LeadAccessContext, leadId: string): Promise<LeadAssignmentView>;
  events(access: LeadAccessContext, leadId: string): Promise<LeadEventView[]>;
  reportDownload(access: LeadAccessContext, leadId: string, expiresInSeconds: number): Promise<LeadReportDownload>;
}
