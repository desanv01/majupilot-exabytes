import "server-only";

import { createHash } from "node:crypto";

import { canonicalJson } from "@/core/reports/canonical-json";
import { renderBlueprintPdf } from "@/infrastructure/reports/render-blueprint-pdf";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import {
  generateReportRequestSchema,
  REPORT_RENDERER_VERSION,
  REPORT_TEMPLATE_VERSION,
  reportArtifactSchema,
  reportGenerationSourceSchema,
  signedReportDownloadSchema,
  type GenerateReportRequest,
  type ReportArtifact,
} from "@/domain/reports";
import type { ReportRepository } from "@/infrastructure/reports/report-repository";

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");

export class ReportService {
  constructor(private readonly reports: ReportRepository, private readonly now: () => string = () => new Date().toISOString()) {}

  async generate(owner: OwnershipContext, raw: unknown, requestId: string): Promise<ReportArtifact> {
    const request = generateReportRequestSchema.parse(raw);
    const source = reportGenerationSourceSchema.parse(await this.reports.loadSource(owner, request));
    const acceptedNoteIds = source.acceptedNotes.map((note) => note.id).sort();
    if (canonicalJson(acceptedNoteIds) !== canonicalJson([...request.acceptedNoteIds].sort())) throw new PersistenceError("NOT_FOUND", 404);
    const identity = {
      assessmentSessionId: request.assessmentSessionId,
      recordBlueprintId: request.blueprintId,
      blueprintId: source.blueprint.id,
      blueprintRevision: source.blueprintRevision,
      blueprintProvenanceHash: source.blueprintProvenanceHash,
      templateVersion: REPORT_TEMPLATE_VERSION,
      rendererVersion: REPORT_RENDERER_VERSION,
      locale: request.locale,
      acceptedNotes: source.acceptedNotes.map((note) => ({ id: note.id, acceptedAt: note.acceptedAt, sourceDraftId: note.sourceDraftId })),
    };
    const renderKey = sha256(canonicalJson(identity));
    const provenanceHash = sha256(canonicalJson({ ...identity, sourceArtifactIds: source.sourceArtifactIds, advisorRunIds: source.advisorRunIds, advisorReviewIds: source.advisorReviewIds }));
    const existing = await this.reports.findByRenderKey(owner, renderKey);
    if (existing?.status === "completed") return reportArtifactSchema.parse(existing);
    if (existing) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
    const generatedAt = this.now();
    const pending = await this.reports.reserve({ owner, request, renderKey, provenanceHash, generatedAt, requestId, source });
    try {
      const rendered = renderBlueprintPdf({
        blueprint: source.blueprint,
        blueprintRevision: source.blueprintRevision,
        reportNumber: pending.reportNumber,
        reportVersion: pending.reportVersion,
        generatedAt,
        locale: request.locale,
        provenanceHash,
        notes: source.acceptedNotes,
      });
      return reportArtifactSchema.parse(await this.reports.complete(owner, pending.id, rendered.bytes, rendered.pageCount, sha256(rendered.bytes), this.now()));
    } catch (error) {
      await this.reports.fail(owner, pending.id, error instanceof PersistenceError ? error.code : "RENDER_FAILED");
      throw error;
    }
  }

  async list(owner: OwnershipContext, assessmentSessionId: string) {
    return Promise.all((await this.reports.list(owner, assessmentSessionId)).map((item) => reportArtifactSchema.parse(item)));
  }

  async signedDownload(owner: OwnershipContext, reportId: string, expiresInSeconds = 300) {
    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 30 || expiresInSeconds > 900) throw new PersistenceError("VALIDATION_FAILED", 422);
    return signedReportDownloadSchema.parse(await this.reports.createSignedDownload(owner, reportId, expiresInSeconds));
  }
}
