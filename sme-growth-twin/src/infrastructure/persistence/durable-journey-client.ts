import type { AssessmentDraft } from "@/domain/assessment";
import type { Blueprint } from "@/domain/blueprint";
import type { BusinessTwin } from "@/domain/business-twin";
import type { LeadReceiptV2 } from "@/domain/lead-sales";
import type { RecommendationResult } from "@/domain/recommendations";
import type { ReportArtifact } from "@/domain/reports";
import type { ScenarioComparison } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";
import { canonicalJson } from "@/core/reports/canonical-json";
import { activeAccountCase } from "./account-case-scope";
import { notifyAccountCaseLocalChange } from "./account-case-events";

export const DURABLE_JOURNEY_STORAGE_KEY = "majupilot:durable-journey:1.0.0";

export type DurableArtifactIds = {
  answers: Record<string, string>;
  businessTwin: string;
  evidence: string[];
  diagnostic: string;
  recommendations: string;
  scenarioComparison: string;
  scenarioRevision: string;
  blueprint: string;
};

export type DurableJourneyContext = {
  guestSessionId?: string;
  organizationId?: string;
  assessmentSessionId: string;
  artifactIds?: DurableArtifactIds;
  sourceFingerprint?: string;
  syncedAt?: string;
  report?: ReportArtifact;
  lead?: LeadReceiptV2;
  leadIdempotencyKey: string;
};

export type DurableJourneySource = {
  draft: AssessmentDraft;
  twin: BusinessTwin;
  diagnostic: DiagnosticResult;
  recommendations: RecommendationResult;
  comparison: ScenarioComparison;
  blueprint: Blueprint;
};

function load(storage: Storage): DurableJourneyContext | undefined {
  const raw = storage.getItem(DURABLE_JOURNEY_STORAGE_KEY);
  if (!raw) return undefined;
  try { return JSON.parse(raw) as DurableJourneyContext; }
  catch { storage.removeItem(DURABLE_JOURNEY_STORAGE_KEY); return undefined; }
}

function save(storage: Storage, context: DurableJourneyContext) {
  storage.setItem(DURABLE_JOURNEY_STORAGE_KEY, JSON.stringify(context));
  notifyAccountCaseLocalChange(storage);
  return context;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function invalidateDurableJourney(storage: Storage) {
  const context = load(storage);
  if (!context) return;
  save(storage, {
    ...context,
    artifactIds: undefined,
    sourceFingerprint: undefined,
    syncedAt: undefined,
    report: undefined,
    lead: undefined,
    leadIdempotencyKey: `lead:${crypto.randomUUID()}`,
  });
}

export async function durableJourneySourceFingerprint(source: DurableJourneySource) {
  const wireSource = JSON.parse(JSON.stringify(source)) as DurableJourneySource;
  return sha256(canonicalJson(wireSource));
}

export function copilotJourneyHref(context: DurableJourneyContext) {
  const blueprintId = context.artifactIds?.blueprint;
  if (!context.syncedAt || !blueprintId) return undefined;
  const query = new URLSearchParams({ assessmentSessionId: context.assessmentSessionId, blueprintId });
  return `/copilot?${query.toString()}`;
}

export function matchesCopilotDeepLink(
  context: DurableJourneyContext,
  requested: { assessmentSessionId?: string; blueprintId?: string },
) {
  if (requested.assessmentSessionId && requested.assessmentSessionId !== context.assessmentSessionId) return false;
  if (requested.blueprintId && requested.blueprintId !== context.artifactIds?.blueprint) return false;
  return true;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => undefined) as { data?: T; error?: { code?: string } } | undefined;
  if (!response.ok || !payload?.data) throw new Error(payload?.error?.code ?? `request_${response.status}`);
  return payload.data;
}

async function ensureSession(storage: Storage) {
  const existing = load(storage);
  if (existing) return existing;
  const accountCase = activeAccountCase(storage);
  if (accountCase) return save(storage, { organizationId: accountCase.organizationId, assessmentSessionId: accountCase.caseId, leadIdempotencyKey: `lead:${crypto.randomUUID()}` });
  const receipt = await json<{ guestSessionId: string; assessmentSessionId: string }>("/api/v2/guest/session", { method: "POST" });
  return save(storage, {
    ...receipt,
    leadIdempotencyKey: `lead:${crypto.randomUUID()}`,
  });
}

function createIds(source: DurableJourneySource): DurableArtifactIds {
  const answerKeys = [
    ...Object.keys(source.draft.answers),
    ...Object.keys(source.draft.followUpAnswers).map((key) => `followUp.${key}`),
  ];
  return {
    answers: Object.fromEntries(answerKeys.map((key) => [key, crypto.randomUUID()])),
    businessTwin: crypto.randomUUID(),
    evidence: source.twin.evidence.map(() => crypto.randomUUID()),
    diagnostic: crypto.randomUUID(),
    recommendations: crypto.randomUUID(),
    scenarioComparison: crypto.randomUUID(),
    scenarioRevision: crypto.randomUUID(),
    blueprint: crypto.randomUUID(),
  };
}

export async function syncDurableJourney(storage: Storage, source: DurableJourneySource) {
  let context = await ensureSession(storage);
  const sourceFingerprint = await durableJourneySourceFingerprint(source);
  if (context.syncedAt && context.artifactIds && context.sourceFingerprint === sourceFingerprint) return context;
  const sourceChanged = context.sourceFingerprint !== sourceFingerprint;
  const artifactIds = sourceChanged || !context.artifactIds ? createIds(source) : context.artifactIds;
  context = save(storage, {
    ...context,
    artifactIds,
    sourceFingerprint,
    syncedAt: undefined,
    report: sourceChanged ? undefined : context.report,
    lead: sourceChanged ? undefined : context.lead,
    leadIdempotencyKey: sourceChanged ? `lead:${crypto.randomUUID()}` : context.leadIdempotencyKey,
  });
  await json("/api/v2/journey/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: context.organizationId, assessmentSessionId: context.assessmentSessionId, ids: artifactIds, ...source }),
  });
  return save(storage, { ...context, artifactIds, syncedAt: new Date().toISOString() });
}

export async function createDurableConsultation(
  storage: Storage,
  source: DurableJourneySource,
  contact: { name: string; businessName: string; email: string; phone?: string; urgency: "within_30_days" | "one_to_three_months" | "three_to_six_months" | "exploring" },
) {
  let context = await syncDurableJourney(storage, source);
  const artifactIds = context.artifactIds;
  if (!artifactIds) throw new Error("journey_not_synced");
  if (context.lead) return context;
  const report = context.report ?? await json<ReportArtifact>("/api/v2/reports", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: context.organizationId, assessmentSessionId: context.assessmentSessionId, blueprintId: artifactIds.blueprint, locale: "en-MY", acceptedNoteIds: [] }),
  });
  context = save(storage, { ...context, report });
  if (!report.contentSha256) throw new Error("report_not_ready");
  const contactConsentId = crypto.randomUUID();
  const reportConsentId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const common = {
    assessmentSessionId: context.assessmentSessionId,
    organizationId: context.organizationId,
    blueprintId: artifactIds.blueprint,
    reportArtifactId: report.id,
    action: "granted",
    consentVersion: "majupilot-consultation-1.0.0",
    policyVersion: "majupilot-privacy-1.0.0",
    locale: "en-MY",
    presentationSurface: "consultation",
    requestId,
    channel: "web",
  } as const;
  await json("/api/v2/consents", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: context.organizationId, consent: { ...common, id: contactConsentId, purpose: "consultation_contact", textHash: await sha256("I consent to MajuPilot using my contact details to respond to this consultation request."), snapshot: { contact, granted: true } } }),
  });
  await json("/api/v2/consents", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: context.organizationId, consent: { ...common, id: reportConsentId, purpose: "report_share_with_sales", textHash: await sha256("I consent to MajuPilot sharing this exact Blueprint report with the assigned consultation team."), snapshot: { reportId: report.id, contentSha256: report.contentSha256, granted: true } } }),
  });
  const lead = await json<LeadReceiptV2>("/api/v2/leads", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assessmentSessionId: context.assessmentSessionId,
      organizationId: context.organizationId,
      blueprintId: artifactIds.blueprint,
      blueprintRevision: 1,
      reportArtifactId: report.id,
      reportContentSha256: report.contentSha256,
      contactConsentId,
      reportConsentId,
      idempotencyKey: context.leadIdempotencyKey,
      contact,
      region: "Malaysia",
      preferredLanguage: "English",
    }),
  });
  return save(storage, { ...context, lead });
}

export function loadDurableJourney(storage: Storage) { return load(storage); }
