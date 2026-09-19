import type { ConsultantNote, ConsultantNoteAcceptanceRequest, ConsultantNoteDraftRequest } from "@/domain/consultant-notes";
import type { OwnershipContext } from "@/domain/persistence";

export interface ConsultantNoteDraftContext {
  blueprintId: string;
  blueprintRevision: number;
  businessSummary: { businessName: string; industry: string; employeeBand: string; objective: string };
  scores: { digitalMaturity: number | null; aiReadiness: number | null };
  painPoints: Array<{ title: string; mechanism: string; evidenceIds: string[] }>;
  recommendations: Array<{ title: string; status: string; whySelected: string; evidenceIds: string[] }>;
  limitations: string[];
}
export interface ConsultantNoteRepository {
  loadDraftContext(owner: OwnershipContext, request: ConsultantNoteDraftRequest): Promise<ConsultantNoteDraftContext>;
  createAiDraft(owner: OwnershipContext, request: ConsultantNoteDraftRequest, body: string, modelCallId: string): Promise<ConsultantNote>;
  acceptDraft(owner: OwnershipContext, request: ConsultantNoteAcceptanceRequest): Promise<ConsultantNote>;
  list(owner: OwnershipContext, assessmentSessionId: string): Promise<ConsultantNote[]>;
}
