import { createHash } from "node:crypto";

import { createLead, ConsentRequiredError } from "@/core/leads/create-lead";
import { createLeadRequestSchema, leadReceiptSchema, type Lead } from "@/domain/leads";
import { processLocalLeadStore } from "@/infrastructure/leads/process-local-lead-store";
import { leadRateLimiter } from "@/infrastructure/leads/rate-limit";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 512 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

async function readBoundedJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) return { ok: false };
  if (!request.body) return { ok: false };
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > MAX_REQUEST_BYTES) { await reader.cancel(); return { ok: false }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch { return { ok: false }; }
}

function receipt(lead: Lead, replayed: boolean) {
  return leadReceiptSchema.parse({ leadReference: lead.id, submittedAt: lead.createdAt, blueprintId: lead.blueprintId, status: lead.status, replayed });
}

const generatedId = (prefix: "lead" | "consent") => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;

export async function POST(request: Request) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return json({ error: "invalid_request" }, 400);
  const body = await readBoundedJson(request);
  if (!body.ok) return json({ error: "invalid_request" }, 400);
  const parsed = createLeadRequestSchema.safeParse(body.value);
  if (!parsed.success || parsed.data.honeypot !== "") return json({ error: "invalid_request" }, 400);
  if (parsed.data.consent.accepted !== true || parsed.data.consent.wordingVersion !== "consultation-consent-1.0.0") return json({ error: "consent_required" }, 422);

  const fingerprint = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  try {
    const existing = await processLocalLeadStore.findBySubmissionId(parsed.data.submissionId);
    if (existing) return existing.fingerprint === fingerprint
      ? json(receipt(existing.lead, true), 200)
      : json({ error: "invalid_request" }, 400);

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const rate = leadRateLimiter.check(forwarded || request.headers.get("x-real-ip") || "unidentified-client");
    if (!rate.allowed) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rate.retryAfterSeconds) });

    const lead = createLead(parsed.data, { leadId: () => generatedId("lead"), consentId: () => generatedId("consent"), now: () => new Date().toISOString() });
    const stored = await processLocalLeadStore.createIdempotently({ fingerprint, lead });
    if (stored.status === "conflict") return json({ error: "invalid_request" }, 400);
    return json(receipt(stored.lead, stored.status === "replayed"), stored.status === "created" ? 201 : 200);
  } catch (error) {
    if (error instanceof ConsentRequiredError) return json({ error: "consent_required" }, 422);
    return json({ error: "lead_unavailable" }, 503);
  }
}
