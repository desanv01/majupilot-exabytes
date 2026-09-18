import type { Blueprint } from "@/domain/blueprint";
import {
  CONSENT_WORDING,
  CONSENT_WORDING_VERSION,
  INITIAL_LEAD_STATUS,
  LEAD_MODEL_VERSION,
  LEAD_SOURCE_CAMPAIGN,
  LEAD_STORAGE_VERSION,
  leadSchema,
  type CreateLeadRequest,
  type Lead,
} from "@/domain/leads";

export class ConsentRequiredError extends Error {
  constructor() { super("consent_required"); this.name = "ConsentRequiredError"; }
}

export interface LeadFactories { leadId: () => string; consentId: () => string; now: () => string }

function clone<T>(value: T): T { return structuredClone(value); }
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function consultantSummary(blueprint: Blueprint) {
  const { twin, diagnostic, recommendations, selectedScenario } = blueprint.snapshot;
  return {
    businessProfile: {
      employeeBand: twin.identity.employeeBand,
      industry: twin.identity.industry,
      budgetBand: twin.constraints.budgetBand,
      implementationPace: twin.constraints.implementationPace,
    },
    scores: {
      digitalMaturity: { value: diagnostic.digitalMaturity.value, band: diagnostic.digitalMaturity.bandLabel, confidence: diagnostic.digitalMaturity.confidence },
      aiReadiness: { value: diagnostic.aiReadiness.value, band: diagnostic.aiReadiness.bandLabel, confidence: diagnostic.aiReadiness.confidence },
    },
    painPoints: diagnostic.painPoints.slice(0, 5).map(({ id, title, priority, mechanism, evidenceIds }) => ({ id, title, priority, mechanism, evidenceIds: [...evidenceIds] })),
    selectedScenario: {
      id: selectedScenario.id,
      title: selectedScenario.title,
      budgetFit: selectedScenario.budgetFit,
      firstYearCost: clone(selectedScenario.costs.firstYear),
      operationalValue: clone(selectedScenario.value.operational),
      netValue: clone(selectedScenario.value.net),
      payback: clone(selectedScenario.value.payback),
      assumptions: clone(selectedScenario.assumptions),
    },
    recommendations: recommendations.recommendations.map((item) => ({
      capabilityId: item.capabilityId, title: item.title, status: item.status, outcome: item.outcome,
      ...(item.mappedOffering ? { mappedOffering: { id: item.mappedOffering.id, name: item.mappedOffering.name } } : {}),
    })),
    advisorFindings: blueprint.advisorReviews.map((review) => ({
      advisor: review.advisor, headline: review.headline, position: review.position,
      concerns: review.concerns.map((item) => item.statement),
      missingEvidence: review.missingEvidence.map((item) => item.statement),
    })),
  };
}

export function createLead(request: CreateLeadRequest, factories: LeadFactories): Lead {
  if (request.consent.accepted !== true || request.consent.wordingVersion !== CONSENT_WORDING_VERSION) throw new ConsentRequiredError();
  const now = factories.now();
  const blueprint = clone(request.blueprint);
  const lead = leadSchema.parse({
    id: factories.leadId(), modelVersion: LEAD_MODEL_VERSION, storageVersion: LEAD_STORAGE_VERSION,
    submissionId: request.submissionId, createdAt: now, updatedAt: now, status: INITIAL_LEAD_STATUS,
    sourceCampaign: LEAD_SOURCE_CAMPAIGN, contact: clone(request.contact), blueprintId: blueprint.id, blueprint,
    consent: {
      id: factories.consentId(), wordingVersion: CONSENT_WORDING_VERSION, wording: CONSENT_WORDING,
      consentedAt: now, submissionId: request.submissionId, blueprintId: blueprint.id,
      blueprintModelVersion: blueprint.modelVersion, blueprintSourceIdentity: clone(blueprint.sourceIdentity),
    },
    summary: consultantSummary(blueprint),
  });
  return deepFreeze(lead);
}
