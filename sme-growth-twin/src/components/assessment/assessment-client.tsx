"use client";

/* eslint-disable react-hooks/set-state-in-effect -- localStorage restoration is an intentional client boundary */
/* eslint-disable jsx-a11y/role-supports-aria-props -- validation is intentionally mirrored on the first radio and its fieldset */
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  FOLLOW_UPS,
  completeCoreAssessment,
  completeFollowUps,
  toggleAiUsageAnswer,
} from "@/core/assessment/follow-ups";
import {
  ASSESSMENT_SCHEMA_VERSION,
  coreAnswersSchema,
  q1Schema,
  q2Schema,
  q3Schema,
  q4Schema,
  q5Schema,
  type AiUsageValue,
  type AssessmentDraft,
  type CoreAnswers,
  type FollowUpId,
} from "@/domain/assessment";
import { assessmentSessionIdSchema } from "@/domain/ids";
import {
  clearAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
} from "@/infrastructure/persistence/local-assessment-store";

import { Brand } from "./brand";
import { Progress } from "./progress";

const stepSchemas = [q1Schema, q2Schema, q3Schema, q4Schema, q5Schema];
const firstFields = [
  "businessName",
  "websiteOrStore",
  "biggestChallenge",
  "primaryObjective",
  "leadershipSponsorship",
];
const titles = [
  "Your business at a glance",
  "Your current digital foundation",
  "Where work gets stuck",
  "Your growth objective and constraints",
  "AI and change readiness",
];
const intros = [
  "Tell us the essentials so your Business Twin reflects how you operate.",
  "Choose the description that best matches each capability today.",
  "Help us understand the workflow that costs the most time or attention.",
  "Set the practical boundaries for your next 12 months.",
  "Rate each area from 1 (very limited) to 5 (strong), or choose Not sure.",
];

const emptyDraft: AssessmentDraft = {
  schemaVersion: ASSESSMENT_SCHEMA_VERSION,
  sessionId: assessmentSessionIdSchema.parse("assessment_pending0001"),
  status: "in_progress",
  currentStep: 1,
  twinRevision: 1,
  answers: {},
  selectedFollowUpIds: [],
  followUpAnswers: {},
  updatedAt: "2026-09-17T00:00:00+08:00",
};

const choices: Record<string, [string, string][]> = {
  industry: [
    ["food_beverage", "Food & beverage"],
    ["retail_ecommerce", "Retail / e-commerce"],
    ["professional_services", "Professional services"],
    ["manufacturing", "Manufacturing"],
    ["technology_digital", "Technology / digital"],
    ["health_wellness", "Health & wellness"],
    ["education_training", "Education / training"],
    ["logistics_distribution", "Logistics / distribution"],
    ["construction_property", "Construction / property"],
    ["other", "Other"],
  ],
  businessModel: [
    ["b2b", "B2B"],
    ["b2c", "B2C"],
    ["hybrid", "Hybrid"],
  ],
  employeeBand: [
    ["1_9", "1–9"],
    ["10_24", "10–24"],
    ["25_49", "25–49"],
    ["50_99", "50–99"],
    ["100_plus", "100+"],
  ],
  biggestChallenge: [
    ["lead_generation", "Lead generation"],
    ["customer_management", "Customer management"],
    ["manual_work", "Manual work"],
    ["team_collaboration", "Team collaboration"],
    ["data_visibility", "Data visibility"],
    ["security_continuity", "Security & continuity"],
    ["scaling_operations", "Scaling operations"],
    ["other", "Other"],
  ],
  primaryObjective: [
    ["increase_revenue", "Increase revenue"],
    ["acquire_customers", "Acquire customers"],
    ["improve_retention", "Improve retention"],
    ["reduce_cost", "Reduce cost"],
    ["increase_productivity", "Increase productivity"],
    ["strengthen_resilience", "Strengthen resilience"],
    ["launch_ai_capability", "Launch an AI capability"],
  ],
  budgetBand: [
    ["under_5k", "Under RM5k"],
    ["5k_15k", "RM5k–15k"],
    ["15k_50k", "RM15k–50k"],
    ["50k_plus", "RM50k+"],
    ["unknown", "Not sure"],
  ],
  implementationPace: [
    ["within_30_days", "Within 30 days"],
    ["1_3_months", "1–3 months"],
    ["3_6_months", "3–6 months"],
    ["6_12_months", "6–12 months"],
  ],
  highestConcern: [
    ["cost", "Cost"],
    ["complexity", "Complexity"],
    ["security", "Security"],
    ["adoption", "Adoption"],
    ["disruption", "Disruption"],
  ],
};

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

const stateChoices: [string, string, string][] = [
  ["not_used", "Not used", "We do not currently use this"],
  ["informal", "Informal", "Used inconsistently or through personal tools"],
  ["active", "Active", "Used regularly in the business"],
  ["unknown", "Not sure", "We cannot confirm this yet"],
];

const followUpOptions: Record<FollowUpId, [string, string][]> = {
  fu_manual_hours: [
    ["under_5", "Under 5"],
    ["5_10", "5–10"],
    ["11_20", "11–20"],
    ["21_40", "21–40"],
    ["over_40", "Over 40"],
    ["unknown", "Not sure"],
  ],
  fu_customer_records: [
    ["spreadsheets", "Spreadsheets"],
    ["messaging_apps", "Messaging apps"],
    ["accounting_system", "Accounting system"],
    ["paper", "Paper"],
    ["multiple_places", "Multiple places"],
    ["unknown", "Not sure"],
  ],
  fu_backup_frequency: [
    ["none", "None"],
    ["ad_hoc", "Ad hoc"],
    ["weekly", "Weekly"],
    ["daily", "Daily"],
    ["managed", "Managed"],
    ["unknown", "Not sure"],
  ],
  fu_sales_channel: [
    ["physical_only", "Physical only"],
    ["social_messaging", "Social / messaging"],
    ["marketplace", "Marketplace"],
    ["own_website", "Own website"],
    ["multiple", "Multiple"],
    ["unknown", "Not sure"],
  ],
  fu_ai_usage: [
    ["content", "Content"],
    ["customer_support", "Customer support"],
    ["analysis", "Analysis"],
    ["administration", "Administration"],
    ["development", "Development"],
    ["other", "Other"],
    ["unknown", "Not sure"],
  ],
  fu_change_barrier: [
    ["time", "Time"],
    ["skills", "Skills"],
    ["leadership_alignment", "Leadership alignment"],
    ["employee_resistance", "Employee resistance"],
    ["unclear_value", "Unclear value"],
    ["other", "Other"],
    ["unknown", "Not sure"],
  ],
};

const followUpTitles: Record<FollowUpId, string> = {
  fu_manual_hours:
    "About how many hours does this manual work take each week?",
  fu_customer_records: "Where are customer records kept today?",
  fu_backup_frequency: "How often is important business data backed up?",
  fu_sales_channel: "Which sales channel matters most today?",
  fu_ai_usage: "Where is AI currently used?",
  fu_change_barrier: "What is the biggest barrier to change?",
};

type Errors = Record<string, string>;
type UpdateAnswer = (section: string, key: string, value: unknown) => void;
type StepProps = {
  value?: Record<string, unknown>;
  update: UpdateAnswer;
  errors: Errors;
};

function now() {
  return new Date().toISOString();
}

function makeDraft(): AssessmentDraft {
  return {
    ...emptyDraft,
    sessionId: assessmentSessionIdSchema.parse(
      `assessment_${crypto.randomUUID()}`,
    ),
    updatedAt: now(),
  };
}

function errorId(name: string) {
  return `${name}-error`;
}

function focusFirstError(errors: Errors) {
  const first = Object.keys(errors)[0];
  if (!first) return;
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-error-field="${first}"]`)
      ?.focus();
  });
}

export function AssessmentClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [draft, setDraft] = useState<AssessmentDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      clearAssessmentDraft(localStorage);
      const fresh = makeDraft();
      saveAssessmentDraft(localStorage, fresh);
      setDraft(fresh);
      history.replaceState(null, "", "/assessment");
    } else {
      const restored = loadAssessmentDraft(localStorage);
      if (restored.status === "ok") {
        setDraft(restored.draft);
      } else {
        const fresh = makeDraft();
        setDraft(fresh);
        if (restored.status === "discarded") {
          setMessage(
            "We found an unreadable or incompatible saved draft. It was safely discarded, so you can start again.",
          );
        }
      }
    }
    setReady(true);
  }, [params]);

  useEffect(() => {
    if (ready && draft.sessionId !== emptyDraft.sessionId) {
      saveAssessmentDraft(localStorage, draft);
    }
  }, [draft, ready]);

  useEffect(() => {
    heading.current?.focus();
  }, [draft.currentStep]);

  const update: UpdateAnswer = (section, key, value) => {
    setDraft((current) => ({
      ...current,
      status: "in_progress",
      answers: {
        ...current.answers,
        [section]: {
          ...(current.answers as Record<string, Record<string, unknown>>)[
            section
          ],
          [key]: value,
        },
      },
    }));
  };

  const continueAssessment = () => {
    const index = draft.currentStep - 1;
    if (index >= 5) {
      const missing = draft.selectedFollowUpIds.filter(
        (id) => draft.followUpAnswers[id] === undefined,
      );
      if (missing.length > 0) {
        const nextErrors = {
          [missing[0]]: "Choose an answer, including Not sure if needed.",
        };
        setErrors(nextErrors);
        focusFirstError(nextErrors);
        return;
      }
      const completed = completeFollowUps(draft, now());
      saveAssessmentDraft(localStorage, completed);
      setDraft(completed);
      router.push("/assessment/review");
      return;
    }

    const section = `q${draft.currentStep}` as keyof CoreAnswers;
    const raw = draft.answers[section];
    const candidate =
      draft.currentStep === 3
        ? {
            ...raw,
            manualHoursPerWeek:
              (raw as CoreAnswers["q3"] | undefined)?.manualHoursPerWeek ??
              null,
            affectedEmployees:
              (raw as CoreAnswers["q3"] | undefined)?.affectedEmployees ?? null,
          }
        : raw;
    const result = stepSchemas[index].safeParse(candidate);

    if (!result.success) {
      const nextErrors: Errors = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? firstFields[index]);
        nextErrors[key] = issue.path.length
          ? issue.message
          : "Complete this step before continuing.";
      });
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    const answers = { ...draft.answers, [section]: result.data };
    if (draft.currentStep === 5) {
      const validatedAnswers = coreAnswersSchema.parse(answers);
      const completedCore = completeCoreAssessment(draft, validatedAnswers, now());
      saveAssessmentDraft(localStorage, completedCore);
      setDraft(completedCore);
      if (completedCore.status === "ready_for_review") {
        router.push("/assessment/review");
      }
      return;
    }

    setDraft((current) => ({
      ...current,
      answers,
      currentStep: current.currentStep + 1,
      updatedAt: now(),
    }));
  };

  const goBack = () => {
    if (draft.currentStep === 1) router.push("/");
    else {
      setDraft((current) => ({
        ...current,
        currentStep: current.currentStep - 1,
        updatedAt: now(),
      }));
    }
  };

  const startOver = () => {
    if (
      confirm(
        "Start over and permanently remove this saved draft from this device?",
      )
    ) {
      clearAssessmentDraft(localStorage);
      const fresh = makeDraft();
      saveAssessmentDraft(localStorage, fresh);
      setDraft(fresh);
      setErrors({});
      setMessage("Your previous draft was removed.");
    }
  };

  if (!ready) {
    return (
      <main className="loading" aria-live="polite">
        Restoring your saved assessment…
      </main>
    );
  }

  const isFollowUp = draft.currentStep === 6;
  return (
    <>
      <header className="topbar">
        <Brand />
        <span className="save-status">✓ Saved on this device</span>
      </header>
      <Progress step={draft.currentStep} />
      <main className="assessment-shell">
        {message ? (
          <div className="notice" role="status">
            {message}
          </div>
        ) : null}
        <p className="eyebrow">
          {isFollowUp
            ? "A few useful follow-ups"
            : `Step ${draft.currentStep} of 5`}
        </p>
        <h1 tabIndex={-1} ref={heading}>
          {isFollowUp
            ? "Help us clarify what matters"
            : titles[draft.currentStep - 1]}
        </h1>
        <p className="lead">
          {isFollowUp
            ? "We ask only questions that can change a later decision. You can always choose Not sure."
            : intros[draft.currentStep - 1]}
        </p>
        <section className="form-card">
          <AssessmentStepContent
            draft={draft}
            update={update}
            setDraft={setDraft}
            errors={errors}
          />
        </section>
        <div className="actions">
          <button className="button secondary" onClick={goBack}>
            ← Back
          </button>
          <button className="button primary" onClick={continueAssessment}>
            {isFollowUp ? "Review Business Twin" : "Continue"} →
          </button>
        </div>
        <button className="start-over" onClick={startOver}>
          Start over
        </button>
      </main>
    </>
  );
}

export function AssessmentStepContent({
  draft,
  update,
  setDraft,
  errors,
}: {
  draft: AssessmentDraft;
  update: UpdateAnswer;
  setDraft: Dispatch<SetStateAction<AssessmentDraft>>;
  errors: Errors;
}) {
  if (draft.currentStep === 1)
    return <Q1 value={draft.answers.q1} update={update} errors={errors} />;
  if (draft.currentStep === 2)
    return <Q2 value={draft.answers.q2} update={update} errors={errors} />;
  if (draft.currentStep === 3)
    return <Q3 value={draft.answers.q3} update={update} errors={errors} />;
  if (draft.currentStep === 4)
    return <Q4 value={draft.answers.q4} update={update} errors={errors} />;
  if (draft.currentStep === 5)
    return <Q5 value={draft.answers.q5} update={update} errors={errors} />;
  return <FollowUps draft={draft} setDraft={setDraft} errors={errors} />;
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="field" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        value={String(value ?? "")}
        onChange={(event) =>
          onChange(
            type === "number"
              ? event.target.value === ""
                ? null
                : Number(event.target.value)
              : event.target.value,
          )
        }
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId(name) : undefined}
        data-error-field={name}
      />
      {error ? (
        <span id={errorId(name)} className="error">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  value: unknown;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="field" htmlFor={name}>
      {label}
      <select
        id={name}
        name={name}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId(name) : undefined}
        data-error-field={name}
      >
        <option value="">Select an option</option>
        {choices[name].map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      {error ? (
        <span id={errorId(name)} className="error">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function Q1({ value = {}, update, errors }: StepProps) {
  return (
    <div className="field-grid">
      <Field
        label="Business name"
        name="businessName"
        value={value.businessName}
        onChange={(next) => update("q1", "businessName", next)}
        error={errors.businessName}
      />
      <SelectField
        label="Industry"
        name="industry"
        value={value.industry}
        onChange={(next) => update("q1", "industry", next)}
        error={errors.industry}
      />
      {value.industry === "other" ? (
        <Field
          label="Your industry"
          name="industryOther"
          value={value.industryOther}
          onChange={(next) => update("q1", "industryOther", next)}
          error={errors.industryOther}
        />
      ) : null}
      <SelectField
        label="Business model"
        name="businessModel"
        value={value.businessModel}
        onChange={(next) => update("q1", "businessModel", next)}
        error={errors.businessModel}
      />
      <SelectField
        label="Employee count"
        name="employeeBand"
        value={value.employeeBand}
        onChange={(next) => update("q1", "employeeBand", next)}
        error={errors.employeeBand}
      />
      <label className="field full" htmlFor="description">
        Short business description
        <textarea
          id="description"
          value={String(value.description ?? "")}
          onChange={(event) =>
            update("q1", "description", event.target.value)
          }
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? errorId("description") : undefined
          }
          data-error-field="description"
        />
        {errors.description ? (
          <span id={errorId("description")} className="error">
            {errors.description}
          </span>
        ) : null}
      </label>
    </div>
  );
}

function Q2({ value = {}, update, errors }: StepProps) {
  return (
    <div className="cap-grid">
      {Object.entries(capabilityLabels).map(([key, label]) => {
        const error = errors[key];
        return (
          <fieldset
            className="choice-card"
            key={key}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId(key) : undefined}
          >
            <legend>{label}</legend>
            <div className="segmented">
              {stateChoices.map(([optionValue, optionLabel, help], index) => (
                <label key={optionValue} title={help}>
                  <input
                    type="radio"
                    name={key}
                    value={optionValue}
                    checked={value[key] === optionValue}
                    onChange={() => update("q2", key, optionValue)}
                    aria-invalid={index === 0 && Boolean(error)}
                    aria-describedby={
                      index === 0 && error ? errorId(key) : undefined
                    }
                    data-error-field={index === 0 ? key : undefined}
                  />
                  <span>{optionLabel}</span>
                </label>
              ))}
            </div>
            {error ? (
              <span id={errorId(key)} className="error">
                {error}
              </span>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}

function Q3({ value = {}, update, errors }: StepProps) {
  return (
    <div className="field-grid">
      <SelectField
        label="Biggest current challenge"
        name="biggestChallenge"
        value={value.biggestChallenge}
        onChange={(next) => update("q3", "biggestChallenge", next)}
        error={errors.biggestChallenge}
      />
      {value.biggestChallenge === "other" ? (
        <Field
          label="Describe the challenge"
          name="challengeOther"
          value={value.challengeOther}
          onChange={(next) => update("q3", "challengeOther", next)}
          error={errors.challengeOther}
        />
      ) : null}
      <Field
        label="Most manual workflow"
        name="manualWorkflow"
        value={value.manualWorkflow}
        onChange={(next) => update("q3", "manualWorkflow", next)}
        error={errors.manualWorkflow}
      />
      <Field
        label="Manual hours per week (leave blank if not sure)"
        name="manualHoursPerWeek"
        type="number"
        value={value.manualHoursPerWeek}
        onChange={(next) => update("q3", "manualHoursPerWeek", next)}
        error={errors.manualHoursPerWeek}
      />
      <Field
        label="Affected employees (leave blank if not sure)"
        name="affectedEmployees"
        type="number"
        value={value.affectedEmployees}
        onChange={(next) => update("q3", "affectedEmployees", next)}
        error={errors.affectedEmployees}
      />
      <Range
        label="Urgency"
        name="urgency"
        value={value.urgency}
        onChange={(next) => update("q3", "urgency", next)}
        error={errors.urgency}
        allowUnknown={false}
      />
    </div>
  );
}

function Q4({ value = {}, update, errors }: StepProps) {
  const fields = [
    ["primaryObjective", "Primary 12-month objective"],
    ["budgetBand", "Budget band (Malaysian ringgit)"],
    ["implementationPace", "Desired implementation pace"],
    ["highestConcern", "Highest concern"],
  ] as const;
  return (
    <div className="field-grid">
      {fields.map(([key, label]) => (
        <SelectField
          key={key}
          label={label}
          name={key}
          value={value[key]}
          onChange={(next) => update("q4", key, next)}
          error={errors[key]}
        />
      ))}
    </div>
  );
}

function Q5({ value = {}, update, errors }: StepProps) {
  const fields = [
    ["leadershipSponsorship", "Leadership sponsorship"],
    ["usableData", "Usable data"],
    ["employeeDigitalSkills", "Employee digital skills"],
    ["processConsistency", "Process consistency"],
    ["changeWillingness", "Willingness to train and change"],
  ] as const;
  return (
    <div className="readiness">
      {fields.map(([key, label]) => (
        <Range
          key={key}
          label={label}
          name={key}
          value={value[key]}
          onChange={(next) => update("q5", key, next)}
          error={errors[key]}
        />
      ))}
    </div>
  );
}

function Range({
  label,
  name,
  value,
  onChange,
  error,
  allowUnknown = true,
}: {
  label: string;
  name: string;
  value: unknown;
  onChange: (value: number | null) => void;
  error?: string;
  allowUnknown?: boolean;
}) {
  return (
    <fieldset
      className="range"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId(name) : undefined}
    >
      <legend>{label}</legend>
      <div>
        {[1, 2, 3, 4, 5].map((number, index) => (
          <label key={number}>
            <input
              type="radio"
              name={name}
              checked={value === number}
              onChange={() => onChange(number)}
              aria-invalid={index === 0 && Boolean(error)}
              aria-describedby={
                index === 0 && error ? errorId(name) : undefined
              }
              data-error-field={index === 0 ? name : undefined}
            />
            <span>{number}</span>
          </label>
        ))}
        {allowUnknown ? (
          <label>
            <input
              type="radio"
              name={name}
              checked={value === null}
              onChange={() => onChange(null)}
            />
            <span>Not sure</span>
          </label>
        ) : null}
      </div>
      <small>1 = very limited · 3 = developing · 5 = strong</small>
      {error ? (
        <span id={errorId(name)} className="error">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}

function FollowUps({
  draft,
  setDraft,
  errors,
}: {
  draft: AssessmentDraft;
  setDraft: Dispatch<SetStateAction<AssessmentDraft>>;
  errors: Errors;
}) {
  return (
    <div className="followups">
      {draft.selectedFollowUpIds.map((id) => {
        const error = errors[id];
        return (
          <fieldset
            className="followup-card"
            key={id}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId(id) : undefined}
          >
            <legend>{followUpTitles[id]}</legend>
            <p className="why">
              <strong>Why we ask:</strong> {FOLLOW_UPS[id].whyWeAsk}
            </p>
            <div className="option-grid">
              {followUpOptions[id].map(([optionValue, optionLabel], index) => {
                const current = draft.followUpAnswers[id];
                const checked =
                  id === "fu_ai_usage"
                    ? Array.isArray(current) &&
                      current.includes(optionValue as AiUsageValue)
                    : current === optionValue;
                return (
                  <label key={optionValue}>
                    <input
                      type={id === "fu_ai_usage" ? "checkbox" : "radio"}
                      name={id}
                      checked={checked}
                      onChange={() =>
                        setDraft((existing) => {
                          const previous = existing.followUpAnswers[id];
                          const answer =
                            id === "fu_ai_usage"
                              ? toggleAiUsageAnswer(
                                  Array.isArray(previous) ? previous : [],
                                  optionValue as AiUsageValue,
                                )
                              : optionValue;
                          return {
                            ...existing,
                            followUpAnswers: {
                              ...existing.followUpAnswers,
                              [id]: answer,
                            },
                            updatedAt: now(),
                          };
                        })
                      }
                      aria-invalid={index === 0 && Boolean(error)}
                      aria-describedby={
                        index === 0 && error ? errorId(id) : undefined
                      }
                      data-error-field={index === 0 ? id : undefined}
                    />
                    <span>{optionLabel}</span>
                  </label>
                );
              })}
            </div>
            {error ? (
              <span id={errorId(id)} className="error">
                {error}
              </span>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
