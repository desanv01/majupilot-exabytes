"use client";

/* eslint-disable react-hooks/set-state-in-effect -- persisted draft restoration is client-only */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { beginTwinEdit } from "@/core/assessment/follow-ups";
import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import {
  clearDiagnosticResult,
} from "@/infrastructure/persistence/local-diagnostic-store";
import {
  coreAnswersSchema,
  type AssessmentDraft,
} from "@/domain/assessment";
import type { BusinessTwin } from "@/domain/business-twin";
import {
  clearAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
} from "@/infrastructure/persistence/local-assessment-store";

import { Brand } from "./brand";
import { Progress } from "./progress";

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
  "1_9": "1–9",
  "10_24": "10–24",
  "25_49": "25–49",
  "50_99": "50–99",
  "100_plus": "100+",
  increase_revenue: "Increase revenue",
  acquire_customers: "Acquire customers",
  improve_retention: "Improve retention",
  reduce_cost: "Reduce cost",
  increase_productivity: "Increase productivity",
  strengthen_resilience: "Strengthen resilience",
  launch_ai_capability: "Launch an AI capability",
  under_5k: "Under RM5k",
  "5k_15k": "RM5k–15k",
  "15k_50k": "RM15k–50k",
  "50k_plus": "RM50k+",
  within_30_days: "Within 30 days",
  "1_3_months": "1–3 months",
  "3_6_months": "3–6 months",
  "6_12_months": "6–12 months",
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

type ReviewRow = {
  label: string;
  value: string;
  unknown?: boolean;
};

type ReviewCard = {
  title: string;
  step: number;
  rows: ReviewRow[];
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "unknown") {
    return "Not sure";
  }
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
      title: "Digital capabilities",
      step: 2,
      rows: twin.capabilities.map((capability) =>
        row(
          capabilityLabels[capability.capabilityId] ?? capability.capabilityId,
          capability.currentState,
        ),
      ),
    },
    {
      title: "Process friction",
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
      title: "Readiness facts",
      step: 5,
      rows: [
        row("Leadership sponsorship", twin.readiness.leadership),
        row("Usable data", twin.readiness.data),
        row("Employee digital skills", twin.readiness.skills),
        row("Process consistency", twin.readiness.process),
        row("Change willingness", twin.readiness.changeWillingness),
      ].map((item) => ({
        ...item,
        value: item.unknown ? item.value : `${item.value} of 5`,
      })),
    },
    {
      title: "Evidence",
      step: 1,
      rows: [
        row("Recorded user facts", `${twin.evidence.length} evidence records`),
        row("Assumptions", "None added"),
        row(
          "Explicit unknowns",
          `${twin.evidence.filter((item) => item.confidence < 1).length} recorded`,
        ),
        row("Twin revision", twin.revision),
      ],
    },
  ];
}

export function BusinessTwinReviewCards({
  twin,
  onEdit,
}: {
  twin: BusinessTwin;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="review-grid">
      {buildReviewCards(twin).map((card) => (
        <section className="review-card" key={card.title}>
          <header>
            <h2>{card.title}</h2>
            <Link
              href={`/assessment?step=${card.step}`}
              onClick={() => onEdit(card.step)}
            >
              Edit
            </Link>
          </header>
          <dl>
            {card.rows.map((item) => (
              <div key={item.label} className={item.unknown ? "unknown" : ""}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

export function ReviewClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<AssessmentDraft>();
  const [twin, setTwin] = useState<BusinessTwin>();

  useEffect(() => {
    const restored = loadAssessmentDraft(localStorage);
    if (restored.status !== "ok") {
      router.replace("/assessment");
      return;
    }
    const answers = coreAnswersSchema.safeParse(restored.draft.answers);
    if (!answers.success || restored.draft.status !== "ready_for_review") {
      router.replace("/assessment");
      return;
    }

    setDraft(restored.draft);
    setTwin(rebuildCurrentTwin(restored.draft));
  }, [router]);

  if (!draft || !twin) {
    return <main className="loading">Building your review from saved facts…</main>;
  }

  const edit = (step: number) => {
    const edited = beginTwinEdit(draft, step, new Date().toISOString());
    saveAssessmentDraft(localStorage, edited);
    clearDiagnosticResult(localStorage);
    setDraft(edited);
  };

  const startOver = () => {
    if (
      confirm(
        "Start over and permanently remove this saved draft from this device?",
      )
    ) {
      clearAssessmentDraft(localStorage);
      router.push("/");
    }
  };

  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="save-status">✓ Saved on this device</span>
      </header>
      <Progress step={5} />
      <main className="review-shell">
        <p className="eyebrow">Review your Business Twin</p>
        <h1>Check the facts before analysis</h1>
        <p className="lead">
          Everything below comes from your answers. Unknowns remain visible,
          and no score, diagnosis, or recommendation has been calculated.
        </p>
        <BusinessTwinReviewCards twin={twin} onEdit={edit} />
        <div className="actions">
          <Link className="button secondary" href="/assessment">
            ← Back to assessment
          </Link>
          <button
            className="button primary"
            onClick={() => {
              saveAssessmentDraft(localStorage, draft);
              router.push("/assessment/analysis");
            }}
          >
            Confirm Business Twin →
          </button>
        </div>
        <button className="start-over" onClick={startOver}>
          Start over
        </button>
      </main>
    </>
  );
}
