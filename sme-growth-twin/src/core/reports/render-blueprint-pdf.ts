import type { Blueprint } from "@/domain/blueprint";
import type { AcceptedConsultantNote } from "@/domain/reports";

type TextStyle = { size: number; bold?: boolean; color?: readonly [number, number, number]; before?: number; after?: number };
type PdfLine = { text: string; x: number; y: number; size: number; bold: boolean; color: readonly [number, number, number] };

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const LEFT = 48;
const RIGHT = 48;
const TOP = 54;
const BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT;
const NAVY = [0.035, 0.102, 0.196] as const;
const BLUE = [0.008, 0.314, 0.647] as const;
const TEAL = [0, 0.49, 0.53] as const;
const SLATE = [0.22, 0.27, 0.34] as const;

function ascii(value: unknown) {
  return String(value ?? "").replace(/[\u2013\u2014]/g, "-").replace(/\u00d7/g, "x").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "-").replace(/\s+/g, " ").trim();
}
function escapePdf(value: string) { return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function wrap(text: string, size: number, width = CONTENT_WIDTH) {
  const words = ascii(text).split(" ").filter(Boolean);
  const max = Math.max(12, Math.floor(width / (size * 0.53)));
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (word.length > max) {
      if (line) { lines.push(line); line = ""; }
      for (let index = 0; index < word.length; index += max) lines.push(word.slice(index, index + max));
    } else if (!line || line.length + word.length + 1 <= max) line += `${line ? " " : ""}${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

class Layout {
  pages: PdfLine[][] = [[]];
  private y = PAGE_HEIGHT - TOP;
  private page = 0;
  private ensure(height: number) {
    if (this.y - height >= BOTTOM) return;
    this.pages.push([]); this.page += 1; this.y = PAGE_HEIGHT - TOP;
  }
  gap(points: number) { this.ensure(points); this.y -= points; }
  text(text: string, style: TextStyle, x = LEFT, width = CONTENT_WIDTH) {
    const lineHeight = style.size * 1.34;
    const lines = wrap(text, style.size, width);
    this.ensure((style.before ?? 0) + lines.length * lineHeight + (style.after ?? 0));
    this.y -= style.before ?? 0;
    for (const line of lines) {
      this.pages[this.page].push({ text: line, x, y: this.y, size: style.size, bold: Boolean(style.bold), color: style.color ?? SLATE });
      this.y -= lineHeight;
    }
    this.y -= style.after ?? 0;
  }
  title(value: string) { this.text(value, { size: 18, bold: true, color: NAVY, before: 12, after: 6 }); }
  heading(value: string) { this.text(value, { size: 12.5, bold: true, color: BLUE, before: 10, after: 4 }); }
  body(value: string) { this.text(value, { size: 9.5, after: 3 }); }
  bullet(value: string) { this.text(`- ${value}`, { size: 9.25, after: 2 }, LEFT + 10, CONTENT_WIDTH - 10); }
}

function range(value: { low: number | null; base: number | null; high: number | null }) {
  return value.low === null || value.base === null || value.high === null ? "Not estimated" : `Low ${value.low.toFixed(0)} | Base ${value.base.toFixed(0)} | High ${value.high.toFixed(0)}`;
}

export interface BlueprintPdfInput {
  blueprint: Blueprint;
  blueprintRevision: number;
  reportNumber: string;
  reportVersion: number;
  generatedAt: string;
  locale: "en-MY";
  provenanceHash: string;
  notes: AcceptedConsultantNote[];
}

export function renderBlueprintPdf(input: BlueprintPdfInput): { bytes: Uint8Array; pageCount: number } {
  const { blueprint } = input;
  const twin = blueprint.snapshot.twin;
  const diagnostic = blueprint.snapshot.diagnostic;
  const recommendations = blueprint.snapshot.recommendations.recommendations;
  const scenario = blueprint.snapshot.selectedScenario;
  const layout = new Layout();

  layout.text("EXABYTES", { size: 11, bold: true, color: TEAL, after: 3 });
  layout.text("MajuPilot Digital & AI Transformation Blueprint", { size: 22, bold: true, color: NAVY, after: 8 });
  layout.body(`Report ${input.reportNumber} | Version ${input.reportVersion} | Blueprint ${blueprint.id} revision ${input.blueprintRevision}`);
  layout.body(`Generated ${input.generatedAt} | Locale ${input.locale} | Template exabytes-blueprint-1.0.0`);
  layout.body(`Provenance ${input.provenanceHash}`);

  layout.title("Executive summary");
  layout.body(`Business: ${twin.identity.businessName} | Industry: ${twin.identity.industry} | Employees: ${twin.identity.employeeBand}`);
  layout.body(`Primary objective: ${twin.objectives[0]?.type ?? "Not recorded"}. Selected plan: ${scenario.title}. ${scenario.intent}`);
  layout.body(`Digital maturity: ${diagnostic.digitalMaturity.value ?? "insufficient evidence"} (${diagnostic.digitalMaturity.bandLabel}). AI readiness: ${diagnostic.aiReadiness.value ?? "insufficient evidence"} (${diagnostic.aiReadiness.bandLabel}).`);

  layout.title("Business profile and constraints");
  layout.body(`Business model: ${twin.identity.businessModel}. Budget: ${twin.constraints.budgetBand}. Implementation pace: ${twin.constraints.implementationPace}.`);
  for (const concern of twin.constraints.concerns) layout.bullet(concern);

  layout.title("Maturity and AI readiness");
  for (const metric of [diagnostic.digitalMaturity, diagnostic.aiReadiness]) {
    layout.heading(`${metric.bandLabel} - score ${metric.value ?? "N/A"}, confidence ${Math.round(metric.confidence * 100)}%`);
    layout.body(`Strongest factor: ${metric.strongestPositiveFactor}`);
    layout.body(`Largest limiting factor: ${metric.largestLimitingFactor}`);
    layout.body(`Next action: ${metric.improvementAction}`);
    for (const missing of metric.missingEvidence) layout.bullet(`Missing evidence: ${missing}`);
  }

  layout.title("Priority pain points and evidence");
  for (const pain of diagnostic.painPoints.slice(0, 6)) {
    layout.heading(`${pain.title} - priority ${pain.priority.toFixed(0)}`);
    layout.body(pain.mechanism);
    layout.body(`Evidence: ${pain.evidenceIds.join(", ")}`);
  }

  layout.title("Recommended capabilities and offerings");
  for (const item of recommendations) {
    layout.heading(`${item.rank}. ${item.title} - ${item.status.replaceAll("_", " ")}`);
    layout.body(item.whySelected);
    layout.body(`Expected operational change: ${item.expectedImpact}`);
    if (item.mappedOffering) {
      layout.body(`Mapped offering: ${item.mappedOffering.provider} ${item.mappedOffering.name} [${item.mappedOffering.classification}]`);
      layout.body(`Official source: ${item.mappedOffering.sourceUrl} (verified ${item.mappedOffering.verifiedAt})`);
    } else layout.body("No active verified offering is mapped; consultant validation is required.");
    for (const prerequisite of item.prerequisites.filter((entry) => entry.status !== "met")) layout.bullet(`${prerequisite.label}: ${prerequisite.explanation}`);
  }

  layout.title("Roadmap: months 1-3, 3-6, and 6-12");
  for (const band of [{ label: "Months 1-3 - foundations and quick wins", min: 1, max: 3 }, { label: "Months 3-6 - productivity and operations", min: 3, max: 6 }, { label: "Months 6-12 - growth, AI, and automation", min: 6, max: 12 }]) {
    layout.heading(band.label);
    const entries = scenario.interventions.filter((item) => item.startMonth <= band.max && item.completionMonth >= band.min);
    if (!entries.length) layout.body("No intervention is currently scheduled in this period.");
    for (const item of entries) layout.bullet(`${item.title}: month ${item.startMonth} to ${item.completionMonth}; ${item.status}; ${item.commitment}.`);
  }

  layout.title("ROI, assumptions, and unestimated streams");
  layout.body(`First-year cost: ${range(scenario.costs.firstYear)}. Budget fit: ${scenario.budgetFit.replaceAll("_", " ")}.`);
  const valueStreams = [["Operational value", scenario.value.operational], ["Revenue value", scenario.value.revenue], ["Avoided-risk value", scenario.value.avoidedRisk], ["Gross value", scenario.value.gross], ["Net value", scenario.value.net]] as const;
  for (const [label, stream] of valueStreams) {
    layout.heading(label);
    layout.body(stream.status === "estimated" ? `${range(stream.range)}. Formula: ${stream.formula}` : `Not estimated. Missing: ${stream.missingFields.join(", ")}. Formula: ${stream.formula}`);
  }
  layout.body(scenario.value.payback.status === "estimated" ? `Payback months - best ${scenario.value.payback.best}, base ${scenario.value.payback.base}, worst ${scenario.value.payback.worst}.` : "Payback is not estimated.");
  for (const exclusion of scenario.value.exclusions) layout.bullet(`Exclusion: ${exclusion}`);

  layout.title("Advisor findings and synthesis");
  layout.body(`Panel decision: ${blueprint.synthesis.decision.replaceAll("_", " ")}. Advisor text is interpretive and cannot change deterministic values.`);
  for (const review of blueprint.advisorReviews) {
    layout.heading(`${review.advisor} advisor - ${review.position.replaceAll("_", " ")} - ${review.origin}`);
    layout.body(review.headline);
    for (const concern of review.concerns.slice(0, 3)) layout.bullet(concern.statement);
  }

  layout.title("Accepted consultant notes");
  if (!input.notes.length) layout.body("No human-accepted consultant note was selected for this report version.");
  for (const note of input.notes) {
    layout.heading(`Accepted ${note.acceptedAt} by member ${note.authorUserId}`);
    layout.body(note.body);
    layout.body(`Note ${note.id}; source AI draft ${note.sourceDraftId}. Human acceptance is authoritative.`);
  }

  layout.title("Evidence, limitations, and provenance");
  for (const limitation of blueprint.limitations) layout.bullet(limitation);
  for (const claim of blueprint.provenance) layout.bullet(`${claim.claimId} [${claim.category}]: ${claim.sourceRefs.join(", ")}`);
  layout.gap(8);
  layout.body("This Blueprint is planning guidance, not a vendor quote, legal advice, or a guaranteed outcome. Product facts should be revalidated at consultation time.");

  return buildPdf(layout.pages, input.reportNumber);
}

function buildPdf(pages: PdfLine[][], reportNumber: string) {
  const objects: string[] = [];
  const add = (value: string) => { objects.push(value); return objects.length; };
  const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pagesObject = add("");
  const pageIds: number[] = [];
  for (const [pageIndex, lines] of pages.entries()) {
    const drawing = ["0.035 0.102 0.196 rg", `0 ${PAGE_HEIGHT - 34} ${PAGE_WIDTH} 34 re f`, "0 0.49 0.53 rg", `0 ${PAGE_HEIGHT - 38} ${PAGE_WIDTH} 4 re f`];
    for (const line of lines) drawing.push(`${line.color.join(" ")} rg BT /${line.bold ? "F2" : "F1"} ${line.size.toFixed(2)} Tf 1 0 0 1 ${line.x.toFixed(2)} ${line.y.toFixed(2)} Tm (${escapePdf(line.text)}) Tj ET`);
    drawing.push(`0.22 0.27 0.34 rg BT /F1 8 Tf 1 0 0 1 ${LEFT} 28 Tm (${escapePdf(reportNumber)}) Tj ET`);
    drawing.push(`0.22 0.27 0.34 rg BT /F1 8 Tf 1 0 0 1 ${PAGE_WIDTH - RIGHT - 44} 28 Tm (Page ${pageIndex + 1} of ${pages.length}) Tj ET`);
    const stream = `${drawing.join("\n")}\n`;
    const contentId = add(`<< /Length ${new TextEncoder().encode(stream).byteLength} >>\nstream\n${stream}endstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }
  objects[pagesObject - 1] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  const catalog = add(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);
  let output = "%PDF-1.7\n%MajuPilot\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(new TextEncoder().encode(output).byteLength); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = new TextEncoder().encode(output).byteLength;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return { bytes: new TextEncoder().encode(output), pageCount: pages.length };
}
