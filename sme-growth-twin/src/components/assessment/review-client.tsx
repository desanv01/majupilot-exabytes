"use client";

/* eslint-disable react-hooks/set-state-in-effect -- persisted draft restoration is client-only */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { beginTwinEdit } from "@/core/assessment/follow-ups";
import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { coreAnswersSchema, type AssessmentDraft } from "@/domain/assessment";
import type { BusinessTwin } from "@/domain/business-twin";
import { clearDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import {
  clearAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
} from "@/infrastructure/persistence/local-assessment-store";

import { AssessmentFrame, type SaveState } from "./assessment-frame";

const capabilityLabels: Record<string, string> = {
  websiteOrStore: "Website or online store",
  businessEmail: "Business email",
  cloudProductivity: "Cloud files or productivity suite",
  crm: "Customer relationship management (CRM)",
  digitalMarketingAnalytics: "Digital marketing or analytics",
  backup: "Backup",
  cybersecurityControls: "Cybersecurity controls",
  aiTools: "AI tools",
};

const valueLabels: Record<string, string> = {
  food_beverage: "Food & beverage",
  retail_ecommerce: "Retail / e-commerce",
  professional_services: "Professional services",
  technology_digital: "Technology / digital",
  health_wellness: "Health & wellness",
  education_training: "Education / training",
  logistics_distribution: "Logistics / distribution",
  construction_property: "Construction / property",
  b2b: "B2B",
  b2c: "B2C",
  hybrid: "Hybrid",
  "1_9": "1-9",
  "10_24": "10-24",
  "25_49": "25-49",
  "50_99": "50-99",
  "100_plus": "100+",
  increase_revenue: "Increase revenue",
  acquire_customers: "Acquire customers",
  improve_retention: "Improve retention",
  reduce_cost: "Reduce cost",
  increase_productivity: "Increase productivity",
  strengthen_resilience: "Strengthen resilience",
  launch_ai_capability: "Launch an AI capability",
  under_5k: "Under RM5k",
  "5k_15k": "RM5k-15k",
  "15k_50k": "RM15k-50k",
  "50k_plus": "RM50k+",
  within_30_days: "Within 30 days",
  "1_3_months": "1-3 months",
  "3_6_months": "3-6 months",
  "6_12_months": "6-12 months",
  not_used: "Not used",
  informal: "Informal",
  active: "Active",
  unknown: "Not sure",
  cost: "Cost",
  complexity: "Complexity",
  security: "Security",
  adoption: "Adoption",
  disruption: "Disruption",
};

type ReviewRow = { label: string; value: string; unknown?: boolean };
type ReviewCard = { title: string; step: number; rows: ReviewRow[] };

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "unknown") return "Not sure";
  const text = String(value);
  return valueLabels[text] ?? text;
}

function row(label: string, value: unknown): ReviewRow {
  return {
    label,
    value: formatValue(value),
    unknown: value === null || value === undefined || value === "unknown",
  };
}

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function saveSafely(storage: Storage | null, draft: AssessmentDraft) {
  if (!storage) return false;
  try {
    saveAssessmentDraft(storage, draft);
    return true;
  } catch {
    return false;
  }
}

export function buildReviewCards(twin: BusinessTwin): ReviewCard[] {
  const identity = twin.identity;
  const process = twin.processes[0];
  return [
    {
      title: "Identity",
      step: 1,
      rows: [
        row("Business name", identity.businessName),
        row("Industry", identity.industryOther ?? identity.industry),
        row("Business model", identity.businessModel),
        row("Employee count", identity.employeeBand),
        row("Description", identity.description),
      ],
    },
    {
      title: "Objectives",
      step: 4,
      rows: [
        row("12-month objective", twin.objectives[0].type),
        row("Implementation pace", twin.constraints.implementationPace),
      ],
    },
    {
      title: "Capabilities",
      step: 2,
      rows: twin.capabilities.map((capability) =>
        row(capabilityLabels[capability.capabilityId] ?? capability.capabilityId, capability.currentState),
      ),
    },
    {
      title: "Process Friction",
      step: 3,
      rows: [
        row("Manual workflow", process.name),
        row("Hours per week", process.manualHoursPerWeek),
        row("Affected employees", process.participants),
      ],
    },
    {
      title: "Constraints",
      step: 4,
      rows: [
        row("Budget band", twin.constraints.budgetBand),
        row("Highest concern", twin.constraints.concerns[0]),
      ],
    },
    {
      title: "Readiness",
      step: 5,
      rows: [
        row("Leadership sponsorship", twin.readiness.leadership),
        row("Usable data", twin.readiness.data),
        row("Employee digital skills", twin.readiness.skills),
        row("Process consistency", twin.readiness.process),
        row("Change willingness", twin.readiness.changeWillingness),
      ].map((item) => ({ ...item, value: item.unknown ? item.value : `${item.value} of 5` })),
    },
    {
      title: "Evidence",
      step: 1,
      rows: [
        row("Recorded user facts", `${twin.evidence.length} evidence records`),
        row("Assumptions", twin.assumptions.length === 0 ? "None added" : twin.assumptions.length),
        row("Explicit unknowns", `${twin.evidence.filter((item) => item.confidence < 1).length} recorded`),
        row("Twin revision", twin.revision),
      ],
    },
  ];
}

function EvidenceDetails({ twin }: { twin: BusinessTwin }) {
  return (
    <details className="evidence-details">
      <summary>View technical evidence references</summary>
      <p>These references connect each saved answer to this Business Twin. They are shown for traceability and are not a score.</p>
      <ul>
        {twin.evidence.map((item) => (
          <li key={item.id}>
            <span>{item.questionId ?? "Assessment record"}</span>
            <code>{item.id}</code>
            <small>Source: {item.source.replaceAll("_", " ")} / Reference: {item.sourceRef}</small>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function BusinessTwinReviewCards({ twin, onEdit }: { twin: BusinessTwin; onEdit: (step: number) => void }) {
  const cards = buildReviewCards(twin);
  const unknownCount = cards.reduce((count, card) => count + card.rows.filter((item) => item.unknown).length, 0);
  return (
    <>
      <nav className="review-overview" aria-label="Jump to Business Twin facts">
        <div><strong>{cards.length} fact groups</strong><span>{cards.reduce((count, card) => count + card.rows.length, 0)} recorded fields · {unknownCount} marked not sure</span></div>
        <a href="#review-identity">Identity</a><a href="#review-capabilities">Capabilities</a><a href="#review-readiness">Readiness</a><a href="#review-evidence">Evidence</a>
      </nav>
      <div className="review-grid">
      {cards.map((card, index) => (
        <section className="review-card" id={`review-${card.title.toLowerCase().replaceAll(" ", "-")}`} key={card.title}>
          <header>
            <div>
              <span className="review-section-index">{String(index + 1).padStart(2, "0")}</span>
              <h2>{card.title}</h2>
            </div>
            <Link className="review-edit" href={`/assessment?step=${card.step}`} onClick={() => onEdit(card.step)} aria-label={`Edit ${card.title}`}>
              Edit
            </Link>
          </header>
          <dl>
            {card.rows.map((item) => (
              <div key={item.label} className={item.unknown ? "unknown" : ""}>
                <dt>{item.label}</dt>
                <dd>
                  <span>{item.value}</span>
                  <span className="fact-state">{item.unknown ? "Not sure" : "Recorded fact"}</span>
                </dd>
              </div>
            ))}
          </dl>
          {card.title === "Evidence" ? <EvidenceDetails twin={twin} /> : null}
        </section>
      ))}
      </div>
    </>
  );
}

export function ReviewClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<AssessmentDraft>();
  const [twin, setTwin] = useState<BusinessTwin>();
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("restoring");
  const storage = useRef<Storage | null>(null);

  useEffect(() => {
    storage.current = getBrowserStorage();
    if (!storage.current) {
      setLoadError("This browser is blocking the saved draft, so the Business Twin cannot be rebuilt here.");
      setSaveState("unavailable");
      return;
    }
    let restored: ReturnType<typeof loadAssessmentDraft>;
    try {
      restored = loadAssessmentDraft(storage.current);
    } catch {
      setLoadError("The saved draft could not be read. Return to the assessment to continue in this browser.");
      setSaveState("unavailable");
      return;
    }
    if (restored.status !== "ok") {
      setLoadError("There is no completed assessment to review yet.");
      setSaveState("unavailable");
      return;
    }
    const answers = coreAnswersSchema.safeParse(restored.draft.answers);
    if (!answers.success || restored.draft.status !== "ready_for_review") {
      setLoadError("Complete the remaining assessment questions before review.");
      setSaveState("saved");
      return;
    }
    setDraft(restored.draft);
    setTwin(rebuildCurrentTwin(restored.draft));
    setSaveState("saved");
  }, []);

  const edit = (step: number) => {
    if (!draft) return;
    const edited = beginTwinEdit(draft, step, new Date().toISOString());
    setSaveState("saving");
    setSaveState(saveSafely(storage.current, edited) ? "saved" : "unavailable");
    if (storage.current) {
      try {
        clearDiagnosticResult(storage.current);
      } catch {
        setSaveState("unavailable");
      }
    }
    setDraft(edited);
  };

  const startOver = () => {
    if (confirm("Start over and permanently remove this saved draft from this device?")) {
      if (storage.current) {
        try {
          clearAssessmentDraft(storage.current);
        } catch {
          setSaveState("unavailable");
        }
      }
      router.push("/");
    }
  };

  if (!draft || !twin) {
    return (
      <AssessmentFrame step={5} currentTopic="Business Twin review" mode="review" saveState={saveState}>
        <main id="main-content" className="review-shell loading-state" aria-live="polite">
          <p className="eyebrow">Review your Business Twin</p>
          <h1>{loadError ? "Your review is not ready yet" : "Building your evidence review"}</h1>
          <p className="lead">{loadError || "We are rebuilding your Business Twin from the facts saved on this device."}</p>
          {loadError ? <Link className="button primary" href="/assessment">Return to assessment</Link> : null}
        </main>
      </AssessmentFrame>
    );
  }

  return (
    <AssessmentFrame step={5} currentTopic="Business Twin review" mode="review" saveState={saveState}>
      <main id="main-content" className="review-shell">
        <header className="review-heading">
          <div>
            <p className="eyebrow">Review your Business Twin</p>
            <h1>Check the facts before analysis</h1>
            <p className="lead">Everything below comes from your answers. Unknowns remain visible, and no score, diagnosis, or recommendation has been calculated.</p>
          </div>
          <aside className="review-trust-note">
            <strong>Your approval matters</strong>
            <p>Confirm only when this record accurately reflects the business today.</p>
          </aside>
        </header>
        <BusinessTwinReviewCards twin={twin} onEdit={edit} />
        <nav className="actions review-actions" aria-label="Business Twin review actions">
          <Link className="button secondary" href="/assessment">Back to assessment</Link>
          <button
            className="button primary"
            onClick={() => {
              if (saveSafely(storage.current, draft)) router.push("/assessment/analysis");
              else setSaveState("unavailable");
            }}
          >
            Confirm Business Twin
          </button>
        </nav>
        <aside className="assessment-danger-zone" aria-label="Start over">
          <div>
            <strong>Need a clean start?</strong>
            <p>This permanently removes the saved draft from this device.</p>
          </div>
          <button className="start-over" onClick={startOver}>Start over</button>
        </aside>
      </main>
    </AssessmentFrame>
  );
}
