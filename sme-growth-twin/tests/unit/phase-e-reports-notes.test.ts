import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ReportService } from "@/core/reports/report-service";
import { renderBlueprintPdf } from "@/core/reports/render-blueprint-pdf";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { REPORT_RENDERER_VERSION, REPORT_TEMPLATE_VERSION, type GenerateReportRequest, type ReportArtifact, type ReportGenerationSource } from "@/domain/reports";
import type { ReportRepository, ReserveReportInput } from "@/infrastructure/reports/report-repository";
import { runConsultantNoteDraft } from "@/infrastructure/model-provider/consultant-note-model";
import { stage05CaseA } from "./stage05-fixtures";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner: Extract<OwnershipContext, { kind: "organization" }> = { kind: "organization", organizationId: uuid(1), userId: uuid(2), role: "consultant" };

class MemoryReports implements ReportRepository {
  artifact: ReportArtifact | null = null;
  bytes: Uint8Array | null = null;
  constructor(readonly source: ReportGenerationSource) {}
  async loadSource() { return this.source; }
  async findByRenderKey(_owner: OwnershipContext, renderKey: string) { return this.artifact?.renderKey === renderKey ? this.artifact : null; }
  async reserve(input: ReserveReportInput) {
    this.artifact = {
      id: uuid(20), reportNumber: "MP-TEST-R1", reportVersion: 1, assessmentSessionId: input.request.assessmentSessionId, blueprintId: input.request.blueprintId,
      blueprintRevision: input.source.blueprintRevision, status: "pending", contentSha256: null, provenanceHash: input.provenanceHash, renderKey: input.renderKey,
      mimeType: "application/pdf", byteLength: null, pageCount: null, storageBucket: null, objectPath: null, selectedNoteIds: [],
      rendererVersion: REPORT_RENDERER_VERSION, templateVersion: REPORT_TEMPLATE_VERSION, generatedAt: input.generatedAt, completedAt: null, createdAt: input.generatedAt,
    };
    return this.artifact;
  }
  async complete(_owner: OwnershipContext, _id: string, bytes: Uint8Array, pageCount: number, sha256: string, completedAt: string) {
    this.bytes = bytes;
    this.artifact = { ...this.artifact!, status: "completed", contentSha256: sha256, byteLength: bytes.byteLength, pageCount, storageBucket: "majupilot-reports", objectPath: `${owner.organizationId}/reports/${uuid(20)}.pdf`, completedAt };
    return this.artifact;
  }
  async fail() { if (this.artifact) this.artifact = { ...this.artifact, status: "failed" }; }
  async list() { return this.artifact ? [this.artifact] : []; }
  async createSignedDownload(requestOwner: OwnershipContext, reportId: string, seconds: number) {
    if (requestOwner.kind !== "organization" || requestOwner.organizationId !== owner.organizationId) throw new PersistenceError("NOT_FOUND", 404);
    return { reportId, url: `https://storage.invalid/signed/${reportId}`, expiresAt: new Date(Date.UTC(2026, 8, 20, 0, 0, seconds)).toISOString() };
  }
}

function source(): ReportGenerationSource {
  const { blueprint } = stage05CaseA();
  return { blueprint, blueprintRevision: 1, blueprintProvenanceHash: "a".repeat(64), rulePackVersion: "1.0.0", catalogueVersion: blueprint.sourceIdentity.catalogueVersion, sourceArtifactIds: [], advisorRunIds: [], advisorReviewIds: [], acceptedNotes: [] };
}

describe("Phase E canonical report", () => {
  it("renders byte-for-byte deterministically with stable content and a valid PDF envelope", async () => {
    const input = { blueprint: source().blueprint, blueprintRevision: 1, reportNumber: "MP-TEST-R1", reportVersion: 1, generatedAt: "2026-09-20T00:00:00.000Z", locale: "en-MY" as const, provenanceHash: "b".repeat(64), notes: [] };
    const first = renderBlueprintPdf(input);
    const second = renderBlueprintPdf(input);
    expect(Buffer.from(second.bytes)).toEqual(Buffer.from(first.bytes));
    expect(createHash("sha256").update(first.bytes).digest("hex")).toBe(createHash("sha256").update(second.bytes).digest("hex"));
    const text = new TextDecoder().decode(first.bytes);
    expect(text.startsWith("%PDF-1.7")).toBe(true);
    expect(text).toContain("MajuPilot Digital & AI Transformation");
    expect(text).toContain("(Blueprint)");
    expect(text).toContain("Accepted consultant notes");
    expect(first.pageCount).toBeGreaterThan(1);
    if (process.env.WRITE_PHASE_E_PDF_PROOF === "1") {
      const output = resolve(process.cwd(), "artifacts", "phase-e", "representative-blueprint.pdf");
      await mkdir(resolve(output, ".."), { recursive: true });
      await writeFile(output, first.bytes);
    }
  });

  it("reuses the immutable artifact for a second authorized generation", async () => {
    const reports = new MemoryReports(source());
    const service = new ReportService(reports, () => "2026-09-20T00:00:00.000Z");
    const request: GenerateReportRequest = { organizationId: owner.organizationId, assessmentSessionId: uuid(3), blueprintId: uuid(4), locale: "en-MY", acceptedNoteIds: [] };
    const first = await service.generate(owner, request, "request-0001");
    const firstBytes = reports.bytes;
    const second = await service.generate(owner, request, "request-0002");
    expect(second.id).toBe(first.id);
    expect(second.contentSha256).toBe(first.contentSha256);
    expect(reports.bytes).toBe(firstBytes);
  });

  it("denies a cross-tenant signed download", async () => {
    const service = new ReportService(new MemoryReports(source()));
    const other: OwnershipContext = { kind: "organization", organizationId: uuid(9), userId: uuid(10), role: "consultant" };
    await expect(service.signedDownload(other, uuid(20), 300)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("Phase E consultant note provenance", () => {
  it("persists a live model call before creating an AI-only draft", async () => {
    const previousMode = process.env.AI_EXECUTION_MODE;
    const previousModel = process.env.AI_GATEWAY_MODEL_CONSULTANT_NOTE;
    const previousKey = process.env.AI_GATEWAY_API_KEY;
    process.env.AI_EXECUTION_MODE = "required";
    process.env.AI_GATEWAY_MODEL_CONSULTANT_NOTE = "test/provider-model";
    process.env.AI_GATEWAY_API_KEY = "test-only";
    const calls: string[] = [];
    const note = {
      id: uuid(30), assessmentSessionId: uuid(3), organizationId: owner.organizationId, leadId: null, origin: "ai_draft" as const, status: "draft" as const,
      body: "Draft guidance grounded in the selected immutable Blueprint evidence.", evidenceIds: [], sourceArtifactIds: [uuid(4)], modelCallId: uuid(40), authorUserId: null, sourceDraftId: null, acceptedAt: null, schemaVersion: "1.0.0" as const, createdAt: "2026-09-20T00:00:00.000Z",
    };
    const notes = {
      loadDraftContext: vi.fn().mockResolvedValue({ blueprintId: uuid(4), blueprintRevision: 1, businessSummary: { businessName: "Example", industry: "retail", employeeBand: "1_9", objective: "growth" }, scores: { digitalMaturity: 40, aiReadiness: 30 }, painPoints: [], recommendations: [], limitations: ["Evidence is incomplete."] }),
      createAiDraft: vi.fn().mockImplementation(async (_owner, _request, _body, modelCallId) => { calls.push("draft"); return { ...note, modelCallId }; }),
      acceptDraft: vi.fn(), list: vi.fn(),
    };
    const persistence = {
      appendModelCall: vi.fn().mockImplementation(async () => { calls.push("model-call"); }),
      getDailyModelSpend: vi.fn().mockResolvedValue(0),
    };
    try {
      const result = await runConsultantNoteDraft(
        { organizationId: owner.organizationId, assessmentSessionId: uuid(3), blueprintId: uuid(4), evidenceIds: [], requestId: "request-note-0001" },
        owner, notes, persistence as never, "test-client",
        { id: () => uuid(40), now: () => Date.parse("2026-09-20T00:00:00.000Z"), preflight: async () => ({}) as never, callProvider: async () => ({ output: { body: note.body }, inputTokens: 20, outputTokens: 30 }) },
      );
      expect(result.state).toBe("live");
      expect(result.note?.origin).toBe("ai_draft");
      expect(result.note?.status).toBe("draft");
      expect(calls).toEqual(["model-call", "draft"]);
    } finally {
      if (previousMode === undefined) delete process.env.AI_EXECUTION_MODE; else process.env.AI_EXECUTION_MODE = previousMode;
      if (previousModel === undefined) delete process.env.AI_GATEWAY_MODEL_CONSULTANT_NOTE; else process.env.AI_GATEWAY_MODEL_CONSULTANT_NOTE = previousModel;
      if (previousKey === undefined) delete process.env.AI_GATEWAY_API_KEY; else process.env.AI_GATEWAY_API_KEY = previousKey;
    }
  });
});
