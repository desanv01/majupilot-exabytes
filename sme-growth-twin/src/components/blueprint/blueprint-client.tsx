"use client";

/* eslint-disable react-hooks/set-state-in-effect -- versioned browser records are restored at this client boundary */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { rebuildCurrentTwin } from "@/core/assessment/rebuild-current-twin";
import { buildAdvisorReviewContext } from "@/core/blueprint/build-review-context";
import { buildBlueprint } from "@/core/blueprint/build-blueprint";
import { advisorPanelResponseSchema, type AdvisorPanelResponse } from "@/domain/advisors";
import type { Blueprint } from "@/domain/blueprint";
import type { BusinessTwin } from "@/domain/business-twin";
import type { RecommendationResult } from "@/domain/recommendations";
import type { ScenarioComparison } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "@/domain-packs/exabytes/advisor-rules";
import { loadAssessmentDraft } from "@/infrastructure/persistence/local-assessment-store";
import { loadBlueprint, saveBlueprint } from "@/infrastructure/persistence/local-blueprint-store";
import { loadDiagnosticResult } from "@/infrastructure/persistence/local-diagnostic-store";
import { loadRecommendationResult } from "@/infrastructure/persistence/local-recommendation-store";
import { loadScenarioComparison } from "@/infrastructure/persistence/local-scenario-store";

import { Brand } from "../assessment/brand";
import { PostAssessmentShell } from "../diagnostics/post-assessment-shell";
import { BlueprintReport, DecisionOverview, originStatuses } from "./blueprint-report";

export type BlueprintSources = {
  twin: BusinessTwin;
  diagnostic: DiagnosticResult;
  recommendations: RecommendationResult;
  comparison: ScenarioComparison;
};

export type AdvisorStatus = "ready" | "reviewing" | "live" | "fallback" | "failed-safe";

const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
const readyStatuses = () => Object.fromEntries(EXABYTES_ADVISORS_1_0_0.map((advisor) => [advisor.id, "ready"])) as Record<string, AdvisorStatus>;
const reviewingStatuses = () => Object.fromEntries(EXABYTES_ADVISORS_1_0_0.map((advisor) => [advisor.id, "reviewing"])) as Record<string, AdvisorStatus>;
const failedStatuses = () => Object.fromEntries(EXABYTES_ADVISORS_1_0_0.map((advisor) => [advisor.id, "failed-safe"])) as Record<string, AdvisorStatus>;

function fallbackPanel(sources: BlueprintSources): AdvisorPanelResponse {
  const context = buildAdvisorReviewContext(sources.twin, sources.diagnostic, sources.recommendations, sources.comparison);
  const reviews = EXABYTES_ADVISORS_1_0_0.map((definition) =>
    buildExabytesFallbackReview(definition, context, makeId("advisor")),
  );
  const modelCalls = EXABYTES_ADVISORS_1_0_0.map((definition) => ({
    id: makeId("modelcall"),
    advisor: definition.id,
    provider: "unavailable" as const,
    model: "request_unavailable",
    promptVersion: "1.0.0" as const,
    schemaVersion: "1.0.0" as const,
    latencyMs: 0,
    retryCount: 0,
    status: "unavailable" as const,
    evidenceIds: [],
    errorCategory: "configuration" as const,
  }));
  return advisorPanelResponseSchema.parse({ reviews, modelCalls });
}

function AdvisorStatusBoard({
  busy,
  blueprint,
  notice,
  statuses,
}: {
  busy: boolean;
  blueprint?: Blueprint;
  notice?: string;
  statuses: Record<string, AdvisorStatus>;
}) {
  const boardTitle = busy ? "Five specialist reviews are resolving" : blueprint ? "Advisor review is complete" : "Five specialist reviews are ready";
  return (
    <section className="phase06-status-board no-print" aria-live="polite" aria-busy={busy}>
      <header>
        <div>
          <p className="eyebrow">Advisor status</p>
          <h2>{boardTitle}</h2>
        </div>
        <p>Live review is optional. Deterministic facts remain authoritative in every state.</p>
      </header>
      <ol>
        {EXABYTES_ADVISORS_1_0_0.map((advisor, index) => {
          const status = statuses[advisor.id];
          return (
            <li className={`advisor-status-item status-${status}`} key={advisor.id}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{advisor.label}</strong>
                <small>{status === "failed-safe" ? "Failed-safe" : status[0].toUpperCase() + status.slice(1)}</small>
              </div>
            </li>
          );
        })}
      </ol>
      {notice ? <p className="phase06-status-notice">{notice}</p> : null}
    </section>
  );
}

function BlueprintCommandHeader({
  blueprint,
  busy,
  onGenerate,
  sources,
}: {
  blueprint?: Blueprint;
  busy: boolean;
  onGenerate: () => void;
  sources: BlueprintSources;
}) {
  const selected = sources.comparison.scenarios.find((scenario) => scenario.id === sources.comparison.selectedScenarioId);
  return (
    <header className="phase06-command blueprint-hero no-print">
      <div className="phase06-command-copy">
        <p className="eyebrow">Decision Blueprint</p>
        <h1>Review the decision before the handoff.</h1>
        <p>
          <strong>{sources.twin.identity.businessName}</strong> selected <strong>{selected?.title}</strong>. Costs, value ranges,
          scores, recommendations, and timing stay deterministic while five advisors interpret the evidence.
        </p>
      </div>
      <nav className="phase06-command-actions" aria-label="Blueprint actions">
        <Link className="button secondary" href="/scenarios">Back to scenarios</Link>
        <button className="button secondary" type="button" onClick={onGenerate} disabled={busy}>
          {blueprint ? "Regenerate review" : "Generate review"}
        </button>
        <button className="button primary" type="button" disabled={!blueprint || busy} onClick={() => window.print()}>
          Print or save as PDF
        </button>
        {blueprint ? <Link className="button consultation-cta" href="/consultation">Request consultation</Link> : null}
      </nav>
    </header>
  );
}

export function BlueprintView({
  sources,
  initialBlueprint,
  initialNotice,
  onPersist,
}: {
  sources: BlueprintSources;
  initialBlueprint?: Blueprint;
  initialNotice?: string;
  onPersist?: (blueprint: Blueprint) => void;
}) {
  const [blueprint, setBlueprint] = useState(initialBlueprint);
  const [notice, setNotice] = useState(initialNotice);
  const [busy, setBusy] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, AdvisorStatus>>(() =>
    initialBlueprint ? originStatuses(initialBlueprint) : readyStatuses(),
  );

  useEffect(() => {
    let openedForPrint: HTMLDetailsElement[] = [];
    const expandReportDisclosures = () => {
      openedForPrint = Array.from(document.querySelectorAll<HTMLDetailsElement>(".phase06-report details:not([open])"));
      openedForPrint.forEach((disclosure) => { disclosure.open = true; });
    };
    const restoreReportDisclosures = () => {
      openedForPrint.forEach((disclosure) => { disclosure.open = false; });
      openedForPrint = [];
    };
    window.addEventListener("beforeprint", expandReportDisclosures);
    window.addEventListener("afterprint", restoreReportDisclosures);
    return () => {
      window.removeEventListener("beforeprint", expandReportDisclosures);
      window.removeEventListener("afterprint", restoreReportDisclosures);
      restoreReportDisclosures();
    };
  }, []);

  const generate = async () => {
    setBusy(true);
    setNotice(undefined);
    setStatuses(reviewingStatuses());
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const context = buildAdvisorReviewContext(sources.twin, sources.diagnostic, sources.recommendations, sources.comparison);
      let panel: AdvisorPanelResponse;
      let fallbackUsed = false;
      let requiredFailure = false;

      try {
        const response = await fetch("/api/advisors/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, advisorIds: EXABYTES_ADVISORS_1_0_0.map((advisor) => advisor.id) }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: { code?: string } } | null;
          requiredFailure = Boolean(body?.error?.code?.startsWith("AI_"));
          throw new Error(body?.error?.code ?? "review_unavailable");
        }
        panel = advisorPanelResponseSchema.parse(await response.json());
      } catch (error) {
        if (requiredFailure) throw error;
        panel = fallbackPanel(sources);
        fallbackUsed = true;
      }

      const next = buildBlueprint(
        { ...sources, panel },
        { id: () => makeId("blueprint"), now: () => new Date().toISOString() },
      );
      onPersist?.(next);
      setBlueprint(next);
      setStatuses(originStatuses(next));
      setNotice(
        fallbackUsed
          ? "Live review was unavailable. All five roles completed with deterministic fallback, and upstream records were not changed."
          : undefined,
      );
    } catch {
      setStatuses(failedStatuses());
      setNotice("The Blueprint could not be saved safely. Upstream records were not changed. Retry when ready.");
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };

  return (
    <PostAssessmentShell businessName={sources.twin.identity.businessName} context="blueprint">
      <main id="main-content" className="phase06-shell">
        <BlueprintCommandHeader blueprint={blueprint} busy={busy} onGenerate={generate} sources={sources} />
        <AdvisorStatusBoard blueprint={blueprint} busy={busy} notice={notice} statuses={statuses} />
        {!blueprint ? (
          <section className="phase06-empty no-print">
            <p className="eyebrow">Ready to review</p>
            <h2>No Blueprint has been generated</h2>
            <p>
              The preferred scenario is ready. Generation creates a new immutable, source-linked record without changing the
              Business Twin, diagnosis, recommendations, or scenario.
            </p>
            <button className="button primary" type="button" onClick={generate} disabled={busy}>
              {busy ? "Reviewing five perspectives" : "Generate advisor review and Blueprint"}
            </button>
          </section>
        ) : (
          <>
            <DecisionOverview blueprint={blueprint} />
            <BlueprintReport blueprint={blueprint} />
          </>
        )}
      </main>
    </PostAssessmentShell>
  );
}

export function BlueprintClient() {
  const router = useRouter();
  const [loaded, setLoaded] = useState<{ sources: BlueprintSources; blueprint?: Blueprint; notice?: string }>();

  useEffect(() => {
    const assessment = loadAssessmentDraft(localStorage);
    if (assessment.status !== "ok" || assessment.draft.status !== "ready_for_review") {
      router.replace("/assessment");
      return;
    }

    try {
      const twin = rebuildCurrentTwin(assessment.draft);
      const diagnostic = loadDiagnosticResult(localStorage, twin);
      if (diagnostic.status !== "ok") {
        router.replace("/assessment/analysis");
        return;
      }
      const recommendations = loadRecommendationResult(localStorage, twin, diagnostic.result);
      if (recommendations.status !== "ok") {
        router.replace("/recommendations");
        return;
      }
      const comparison = loadScenarioComparison(localStorage, twin, diagnostic.result, recommendations.result);
      if (comparison.status !== "ok") {
        router.replace("/scenarios");
        return;
      }

      const sources = { twin, diagnostic: diagnostic.result, recommendations: recommendations.result, comparison: comparison.result };
      if (!comparison.result.selectedScenarioId) {
        setLoaded({ sources, notice: "Choose a preferred scenario before generating a Blueprint." });
        return;
      }

      const saved = loadBlueprint(localStorage, twin, diagnostic.result, recommendations.result, comparison.result);
      setLoaded({
        sources,
        blueprint: saved.status === "ok" ? saved.result : undefined,
        notice:
          saved.status === "discarded"
            ? `The previous Blueprint was ${saved.reason} and was safely discarded. Generate a new review when ready.`
            : undefined,
      });
    } catch {
      router.replace("/scenarios");
    }
  }, [router]);

  if (!loaded) {
    return (
      <PostAssessmentShell context="restoring-blueprint">
        <main className="phase06-restoring" aria-busy="true">
          <p className="eyebrow">Validating source chain</p>
          <h1>Preparing the decision Blueprint.</h1>
          <p>The selected scenario, immutable source identities, and saved review are being checked locally.</p>
          <div className="phase06-restoring-shape" aria-hidden="true"><span /><span /><span /></div>
        </main>
      </PostAssessmentShell>
    );
  }

  if (!loaded.sources.comparison.selectedScenarioId) {
    return (
      <PostAssessmentShell businessName={loaded.sources.twin.identity.businessName} context="blueprint">
        <main className="phase06-missing">
          <Brand />
          <p className="eyebrow">Safe return required</p>
          <h1>A preferred scenario is required.</h1>
          <p>{loaded.notice}</p>
          <Link className="button primary" href="/scenarios">Return to scenarios</Link>
        </main>
      </PostAssessmentShell>
    );
  }

  return (
    <BlueprintView
      sources={loaded.sources}
      initialBlueprint={loaded.blueprint}
      initialNotice={loaded.notice}
      onPersist={(result) => saveBlueprint(localStorage, result)}
    />
  );
}
