import type { OwnershipContext } from "@/domain/persistence";
import type { GenerateReportRequest, ReportArtifact, ReportGenerationSource } from "@/domain/reports";

export interface ReserveReportInput {
  owner: OwnershipContext;
  request: GenerateReportRequest;
  renderKey: string;
  provenanceHash: string;
  generatedAt: string;
  requestId: string;
  source: ReportGenerationSource;
}
export interface ReportRepository {
  loadSource(owner: OwnershipContext, request: GenerateReportRequest): Promise<ReportGenerationSource>;
  findByRenderKey(owner: OwnershipContext, renderKey: string): Promise<ReportArtifact | null>;
  reserve(input: ReserveReportInput): Promise<ReportArtifact>;
  complete(owner: OwnershipContext, reportId: string, bytes: Uint8Array, pageCount: number, sha256: string, completedAt: string): Promise<ReportArtifact>;
  fail(owner: OwnershipContext, reportId: string, category: string): Promise<void>;
  list(owner: OwnershipContext, assessmentSessionId: string): Promise<ReportArtifact[]>;
  createSignedDownload(owner: OwnershipContext, reportId: string, expiresInSeconds: number): Promise<{ reportId: string; url: string; expiresAt: string }>;
}
