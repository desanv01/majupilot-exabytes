import "server-only";

import { calculateScenarioValue, budgetFit, addRanges, roundMoney } from "@/core/roi/calculate-roi";
import { scenarioAssumptionsSchema, scenarioResultSchema } from "@/domain/scenarios";
import { copilotWriteToolInputSchemas } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { ReportService } from "@/infrastructure/reports/report-service";
import { SupabaseReportRepository } from "@/infrastructure/reports/supabase-report-repository";
import { SupabaseConsultantNoteRepository } from "@/infrastructure/consultant-notes/supabase-consultant-note-repository";
import { runConsultantNoteDraft } from "@/infrastructure/model-provider/consultant-note-model";
import { SupabasePersistenceRepository } from "@/infrastructure/persistence/supabase-repository";
import { DurableLeadService } from "@/infrastructure/leads/durable-lead-service";
import { SupabaseDurableLeadRepository } from "@/infrastructure/leads/supabase-durable-lead-repository";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";

import type { CopilotConfirmation, CopilotRepository } from "./copilot-repository";

type Row = Record<string, unknown>;

export class CopilotWriteExecutor {
  private readonly db = createAdminSupabaseClient();
  private readonly persistence = new SupabasePersistenceRepository();

  constructor(private readonly repository: CopilotRepository) {}

  async execute(owner: OwnershipContext, confirmationId: string, executionKey: string, clientKey: string) {
    const confirmation = await this.repository.claimConfirmation(owner, confirmationId, executionKey);
    if (confirmation.status === "executed") return confirmation;
    try {
      const session = await this.repository.getSession(owner, confirmation.chatSessionId);
      const args = confirmation.arguments;
      let result: Record<string, unknown>;
      switch (confirmation.toolName) {
        case "recalculateScenario":
        case "collectMissingRoiInput": result = await this.recalculate(owner, session.assessmentSessionId, confirmation); break;
        case "draftConsultantNote": {
          const parsed = copilotWriteToolInputSchemas.draftConsultantNote.parse(args);
          const response = await runConsultantNoteDraft({ ...parsed, assessmentSessionId: session.assessmentSessionId }, owner, new SupabaseConsultantNoteRepository(), this.persistence, clientKey);
          result = { noteId: response.note?.id ?? null, state: response.state, model: response.model ?? null };
          break;
        }
        case "acceptConsultantNote": {
          const parsed = copilotWriteToolInputSchemas.acceptConsultantNote.parse(args);
          const note = await new SupabaseConsultantNoteRepository().acceptDraft(owner, { ...parsed, assessmentSessionId: session.assessmentSessionId });
          result = { noteId: note.id, status: note.status, acceptedAt: note.acceptedAt };
          break;
        }
        case "generateBlueprintReport": {
          const parsed = copilotWriteToolInputSchemas.generateBlueprintReport.parse(args);
          const report = await new ReportService(new SupabaseReportRepository()).generate(owner, { ...parsed, assessmentSessionId: session.assessmentSessionId }, executionKey);
          result = { reportId: report.id, reportNumber: report.reportNumber, reportVersion: report.reportVersion, status: report.status, contentSha256: report.contentSha256 };
          break;
        }
        case "requestConsultation": {
          const parsed = copilotWriteToolInputSchemas.requestConsultation.parse(args);
          const receipt = await new DurableLeadService(new SupabaseDurableLeadRepository()).create(owner, { ...parsed, assessmentSessionId: session.assessmentSessionId }, executionKey, executionKey);
          result = { receiptId: receipt.receiptId, leadId: receipt.leadId, status: receipt.status, assignmentState: receipt.assignmentState, replayed: receipt.replayed };
          break;
        }
      }
      return this.repository.completeConfirmation(owner, confirmationId, result);
    } catch (error) {
      await this.repository.failConfirmation(owner, confirmationId, error instanceof PersistenceError ? error.code : "INTERNAL_RETRYABLE");
      throw error;
    }
  }

  private async recalculate(owner: OwnershipContext, assessmentSessionId: string, confirmation: CopilotConfirmation) {
    await this.persistence.assertAssessmentAccess(owner, assessmentSessionId);
    const revisionId = String(confirmation.arguments.scenarioRevisionId);
    const loaded = await this.db.from("scenario_revisions").select("*,scenario_comparisons!inner(assessment_session_id,business_twin_id)").eq("id", revisionId).eq("scenario_comparisons.assessment_session_id", assessmentSessionId).maybeSingle();
    if (loaded.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: loaded.error });
    if (!loaded.data) throw new PersistenceError("NOT_FOUND", 404);
    const row = loaded.data as Row;
    const assumptions = scenarioAssumptionsSchema.parse(confirmation.arguments.assumptions);
    const previous = scenarioResultSchema.parse(row.results);
    const firstYearRaw = addRanges(assumptions.costs.implementation.range, assumptions.costs.training.range, assumptions.costs.annualRecurring.range);
    const firstYear = { low: roundMoney(firstYearRaw.low), base: roundMoney(firstYearRaw.base), high: roundMoney(firstYearRaw.high) };
    const twinId = String((row.scenario_comparisons as Row).business_twin_id);
    const twin = await this.db.from("business_twins").select("payload").eq("id", twinId).eq("assessment_session_id", assessmentSessionId).single();
    if (twin.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: twin.error });
    const budgetBand = ((twin.data.payload as Row).constraints as Row).budgetBand as Parameters<typeof budgetFit>[1];
    const nextResult = scenarioResultSchema.parse({ ...previous, assumptions, costs: { ...previous.costs, implementation: assumptions.costs.implementation.range, training: assumptions.costs.training.range, annualRecurring: assumptions.costs.annualRecurring.range, firstYear }, value: calculateScenarioValue(assumptions, firstYear), budgetFit: budgetFit(firstYear, budgetBand) });
    const latest = await this.db.from("scenario_revisions").select("revision").eq("scenario_comparison_id", row.scenario_comparison_id).order("revision", { ascending: false }).limit(1).single();
    if (latest.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: latest.error });
    const id = crypto.randomUUID();
    const inserted = await this.db.from("scenario_revisions").insert({ id, scenario_comparison_id: row.scenario_comparison_id, revision: latest.data.revision + 1, assumptions, results: nextResult, source_artifact_ids: [...new Set([...(row.source_artifact_ids as string[] ?? []), revisionId])], schema_version: row.schema_version, supersedes_id: revisionId, created_by: owner.kind === "organization" ? owner.userId : null }).select("id,revision,created_at").single();
    if (inserted.error?.code === "23505") throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409, { cause: inserted.error });
    if (inserted.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: inserted.error });
    return { scenarioRevisionId: inserted.data.id, revision: inserted.data.revision, supersedesId: revisionId, results: { costs: nextResult.costs, value: nextResult.value, budgetFit: nextResult.budgetFit }, createdAt: inserted.data.created_at };
  }
}
