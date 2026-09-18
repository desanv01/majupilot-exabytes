"use client";

/* eslint-disable react-hooks/set-state-in-effect -- the source chain and session receipt are browser-owned */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/assessment/brand";
import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { contactSchema, leadReceiptSchema, type LeadReceipt } from "@/domain/leads";
import { EXABYTES_CONSULTATION_POLICY } from "@/domain-packs/exabytes/consultation-rules";
import { ASSESSMENT_STORAGE_KEY, loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { BLUEPRINT_STORAGE_KEY, loadBlueprint } from "@/infrastructure/persistence/local-blueprint-store";
import { DIAGNOSTIC_STORAGE_KEY, loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { RECOMMENDATION_STORAGE_KEY, loadRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";
import { SCENARIO_STORAGE_KEY, loadScenarioComparison } from "@/infrastructure/persistence/local-scenario-store";
import { clearLeadReceipt, loadLeadReceipt, saveLeadReceipt } from "@/infrastructure/persistence/session-lead-receipt-store";
import type { Blueprint } from "@/domain/blueprint";

const urgencyLabels = {
  within_30_days: "Within 30 days",
  one_to_three_months: "Within 1–3 months",
  three_to_six_months: "Within 3–6 months",
  exploring: "Exploring options",
} as const;
type FormState = { name: string; businessName: string; email: string; phone: string; urgency: keyof typeof urgencyLabels | ""; consent: boolean; website: string };
type FieldErrors = Partial<Record<keyof FormState, string>>;

function JourneyRail() { return <nav className="journey-rail consultation-journey" aria-label="Growth Twin journey"><ol>{["Discover", "Diagnose", "Compare", "Blueprint"].map((label) => <li className="done" key={label}><span>✓</span><em>{label}</em></li>)}</ol></nav>; }
const score = (value: number | null) => value === null ? "—" : value.toFixed(1);

function Success({ receipt, onNew }: { receipt: LeadReceipt; onNew: () => void }) {
  return <main className="consultation-shell success-shell">
    <section className="consultation-success-hero"><span className="success-check" aria-hidden="true">✓</span><div><p className="eyebrow">Consultation request</p><h1>Your consultation request has been recorded.</h1><p>This prototype recorded the request and its evidence-ready Blueprint. No email, CRM delivery, or human review is claimed.</p></div></section>
    <section className="receipt-card" aria-labelledby="receipt-heading"><p className="eyebrow" id="receipt-heading">Your request details</p><dl><div><dt>Lead reference</dt><dd>{receipt.leadReference}</dd></div><div><dt>Submitted time</dt><dd>{new Date(receipt.submittedAt).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}</dd></div><div><dt>Blueprint ID</dt><dd>{receipt.blueprintId}</dd></div></dl></section>
    <section className="next-steps"><h2>What happens next?</h2><p>Keep the lead reference with your Blueprint. A production handoff can later connect this recorded request to a consultant workflow; this process-local prototype does not send it externally.</p><ol><li><strong>1. Recorded</strong><span>The consented request and exact Blueprint snapshot are held by this running prototype.</span></li><li><strong>2. Ready</strong><span>The consultant summary preserves scores, priorities, scenario assumptions, and findings.</span></li><li><strong>3. Future handoff</strong><span>Durable delivery and consultant access remain production work.</span></li></ol></section>
    <div className="success-actions"><Link className="button primary" href="/blueprint">Return to Blueprint</Link><button className="button secondary" type="button" onClick={onNew}>Start a new assessment</button></div>
  </main>;
}

export function ConsultationView({ blueprint, initialReceipt }: { blueprint: Blueprint; initialReceipt?: LeadReceipt }) {
  const router = useRouter(); const submissionId = useRef(crypto.randomUUID());
  const [receipt, setReceipt] = useState(initialReceipt);
  const [form, setForm] = useState<FormState>({ name: "", businessName: blueprint.snapshot.twin.identity.businessName, email: "", phone: "", urgency: "", consent: false, website: "" });
  const [errors, setErrors] = useState<FieldErrors>({}); const [status, setStatus] = useState<string>(); const [busy, setBusy] = useState(false);
  const selected = blueprint.snapshot.selectedScenario; const diagnostic = blueprint.snapshot.diagnostic;
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })); setStatus(undefined); };
  const validate = () => {
    const next: FieldErrors = {}; const contact = contactSchema.safeParse({ name: form.name, businessName: form.businessName, email: form.email, ...(form.phone.trim() ? { phone: form.phone } : {}), urgency: form.urgency });
    if (!contact.success) for (const issue of contact.error.issues) { const key = issue.path[0] as keyof FormState; if (!next[key]) next[key] = issue.path[0] === "urgency" ? "Choose when you would like to explore the consultation." : `Enter a valid ${issue.path[0] === "name" ? "contact name" : String(issue.path[0]).replace(/([A-Z])/g, " $1").toLowerCase()}.`; }
    if (!form.consent) next.consent = "Consent is required before a request can be recorded.";
    setErrors(next); return { valid: Object.keys(next).length === 0, contact: contact.success ? contact.data : undefined };
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); const checked = validate(); if (!checked.valid || !checked.contact) return;
    setBusy(true); setStatus(undefined);
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: submissionId.current, contact: checked.contact, consent: { accepted: form.consent, wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, honeypot: form.website, blueprint }) });
      const payload: unknown = await response.json();
      if (response.ok) { const safe = leadReceiptSchema.parse(payload); saveLeadReceipt(sessionStorage, safe); setReceipt(safe); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      const code = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "lead_unavailable";
      setStatus(code === "consent_required" ? "Consent is required before this request can be recorded." : code === "rate_limited" ? "Too many new requests were attempted. Please wait before trying again." : code === "invalid_request" ? "The request could not be validated. Review the fields and try again." : "The request could not be recorded safely. Your entries remain here so you can retry.");
    } catch { setStatus("The request could not be recorded safely. Your entries remain here so you can retry."); }
    finally { setBusy(false); }
  };
  const startNew = () => {
    for (const key of [ASSESSMENT_STORAGE_KEY, DIAGNOSTIC_STORAGE_KEY, RECOMMENDATION_STORAGE_KEY, SCENARIO_STORAGE_KEY, BLUEPRINT_STORAGE_KEY]) localStorage.removeItem(key);
    clearLeadReceipt(sessionStorage); router.push("/assessment?new=1");
  };
  if (receipt) return <Success receipt={receipt} onNew={startNew} />;
  return <main className="consultation-shell">
    <header className="consultation-hero"><p className="eyebrow">Request a consultation</p><h1>Request an evidence-ready consultation.</h1><p>Review the exact Blueprint handoff, add only the contact details needed for this request, and decide whether to consent.</p></header>
    <section className="consultation-context" aria-label="Blueprint handoff target"><div><span>Business</span><strong>{blueprint.snapshot.twin.identity.businessName}</strong></div><div><span>Selected scenario</span><strong>{selected.title}</strong></div><div><span>Digital maturity</span><strong>{score(diagnostic.digitalMaturity.value)} /100</strong></div><div><span>AI readiness</span><strong>{score(diagnostic.aiReadiness.value)} /100</strong></div><div><span>Blueprint ID</span><strong>{blueprint.id}</strong></div></section>
    <div className="consultation-grid"><form className="consultation-form" onSubmit={submit} noValidate>
      <section><h2>Contact details</h2><p>Tell us who a future consultant should contact about this Blueprint.</p><div className="consultation-fields">
        <label><span>Contact name <b aria-hidden="true">*</b></span><input name="name" autoComplete="name" maxLength={100} value={form.name} onChange={(e) => update("name", e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name ? <small className="field-error" id="name-error">{errors.name}</small> : null}</label>
        <label><span>Business name <b aria-hidden="true">*</b></span><input name="businessName" autoComplete="organization" maxLength={140} value={form.businessName} onChange={(e) => update("businessName", e.target.value)} aria-invalid={Boolean(errors.businessName)} aria-describedby={errors.businessName ? "business-error" : undefined} />{errors.businessName ? <small className="field-error" id="business-error">{errors.businessName}</small> : null}</label>
        <label><span>Email address <b aria-hidden="true">*</b></span><input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} value={form.email} onChange={(e) => update("email", e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : "email-hint"} /><small id="email-hint">Used only for this consultation request.</small>{errors.email ? <small className="field-error" id="email-error">{errors.email}</small> : null}</label>
        <label><span>Phone number (optional)</span><input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={32} value={form.phone} onChange={(e) => update("phone", e.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} />{errors.phone ? <small className="field-error" id="phone-error">{errors.phone}</small> : null}</label>
        <label className="full"><span>Consultation urgency <b aria-hidden="true">*</b></span><select name="urgency" value={form.urgency} onChange={(e) => update("urgency", e.target.value as FormState["urgency"])} aria-invalid={Boolean(errors.urgency)} aria-describedby={errors.urgency ? "urgency-error" : "urgency-hint"}><option value="">Select an urgency</option>{Object.entries(urgencyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select><small id="urgency-hint">This helps a future handoff prioritise your request.</small>{errors.urgency ? <small className="field-error" id="urgency-error">{errors.urgency}</small> : null}</label>
        <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} /></label>
      </div></section>
      <section className="share-disclosure"><h2>What will be shared</h2><p>The recorded lead contains these exact categories from the current Blueprint:</p><ul><li>Contact details and requested urgency</li><li>Business profile bands and score summary</li><li>Top five pain points and supporting evidence</li><li>Selected scenario, ROI assumptions, capabilities, and mapped offerings</li><li>Advisor findings, Blueprint identity, evidence, and limitations</li></ul><p><strong>Contact details are not sent to the model</strong> and are not used to calculate scores, recommendations, ROI, or the Blueprint.</p></section>
      <section className={`consent-card ${errors.consent ? "invalid" : ""}`}><label><input type="checkbox" name="consent" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : "consent-copy"} /><span><strong>I consent to this consultation request</strong><small id="consent-copy">{EXABYTES_CONSULTATION_POLICY.consentWording}</small></span></label>{errors.consent ? <small className="field-error" id="consent-error">{errors.consent}</small> : null}</section>
      {status ? <p className="submission-error" role="alert">{status}</p> : null}<button className="button primary consultation-submit" type="submit" disabled={busy}>{busy ? "Recording request…" : "Submit consultation request"}</button>
    </form><aside className="consultation-aside"><p className="eyebrow">Privacy and handoff</p><h2>Your evidence stays inspectable.</h2><ul><li><strong>Exact Blueprint</strong><span>No replacement or older report is submitted.</span></li><li><strong>Explicit choice</strong><span>Consent starts unchecked and is enforced by the form, API, and core.</span></li><li><strong>Safe receipt</strong><span>Only the lead reference, time, Blueprint ID, and status are kept in this browser session.</span></li><li><strong>Prototype boundary</strong><span>The record is process-local. No email, webhook, CRM, or external send occurs.</span></li></ul><Link href="/blueprint">← Return to the same Blueprint</Link></aside></div>
  </main>;
}

export function ConsultationClient() {
  const router = useRouter(); const [loaded, setLoaded] = useState<{ blueprint: Blueprint; receipt?: LeadReceipt }>();
  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage); if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") { router.replace("/blueprint"); return; }
    try {
      const twin = rebuildCurrentTwin(assessment.draft); const diagnostic = loadDiagnosticResult(localStorage, twin); if (diagnostic.status !== "ok") { router.replace("/blueprint"); return; }
      const recommendations = loadRecommendationResult(localStorage, twin, diagnostic.result); if (recommendations.status !== "ok") { router.replace("/blueprint"); return; }
      const comparison = loadScenarioComparison(localStorage, twin, diagnostic.result, recommendations.result); if (comparison.status !== "ok") { router.replace("/blueprint"); return; }
      const blueprint = loadBlueprint(localStorage, twin, diagnostic.result, recommendations.result, comparison.result); if (blueprint.status !== "ok") { router.replace("/blueprint"); return; }
      const saved = loadLeadReceipt(sessionStorage); setLoaded({ blueprint: blueprint.result, receipt: saved?.blueprintId === blueprint.result.id ? saved : undefined });
    } catch { router.replace("/blueprint"); }
  }, [router]);
  if (!loaded) return <main className="loading">Validating the current Blueprint and source chain…</main>;
  return <><header className="topbar"><Brand /><span className="save-status">Blueprint verified</span></header><JourneyRail /><ConsultationView blueprint={loaded.blueprint} initialReceipt={loaded.receipt} /></>;
}
