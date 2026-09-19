import type { ArtifactWrite, AssessmentAnswerRecord, ConsentAppend, DataRequest, GuestSessionReceipt, OwnershipContext } from "@/domain/persistence";
import type { ModelCallTelemetry } from "@/domain/ai-execution";

export interface PersistenceRepository {
  issueGuest(tokenDigest: string): Promise<GuestSessionReceipt>;
  resumeGuest(tokenDigest: string, newDigest: string): Promise<GuestSessionReceipt>;
  revokeGuest(tokenDigest: string): Promise<void>;
  resolveGuest(tokenDigest: string): Promise<OwnershipContext & { assessmentSessionId: string }>;
  claimGuest(tokenDigest: string, userId: string, organizationId: string): Promise<GuestSessionReceipt>;
  resolveMembership(userId: string, organizationId: string): Promise<OwnershipContext>;
  saveAnswer(owner: OwnershipContext, record: AssessmentAnswerRecord): Promise<void>;
  saveArtifact(owner: OwnershipContext, record: ArtifactWrite): Promise<void>;
  appendConsent(owner: OwnershipContext, record: ConsentAppend): Promise<void>;
  createExport(owner: OwnershipContext, request: DataRequest): Promise<string>;
  createDeletion(owner: OwnershipContext, request: DataRequest): Promise<string>;
  getDataRequest(owner: OwnershipContext, kind: "export" | "deletion", id: string): Promise<Record<string, unknown>>;
  appendModelCall(owner: OwnershipContext, record: ModelCallTelemetry): Promise<void>;
  getDailyModelSpend(owner: OwnershipContext): Promise<number>;
  assertAssessmentAccess(owner: OwnershipContext, assessmentSessionId: string): Promise<void>;
}
