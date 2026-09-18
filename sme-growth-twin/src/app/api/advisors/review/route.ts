import { z } from "zod";

import { advisorIdSchema, advisorPanelResponseSchema, advisorReviewContextSchema } from "@/domain/advisors";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "@/domain-packs/exabytes/advisor-rules";
import { advisorRateLimiter } from "@/infrastructure/leads/rate-limit";
import { reviewWithConfiguredModel } from "@/infrastructure/model-provider/advisor-model-review";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 256 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

const requestSchema = z.object({ context: advisorReviewContextSchema, advisorIds: z.array(advisorIdSchema).length(5) }).strict().superRefine((request, context) => {
  if (new Set(request.advisorIds).size !== request.advisorIds.length) context.addIssue({ code: "custom", path: ["advisorIds"], message: "Advisor IDs must be unique" });
  const expected = EXABYTES_ADVISORS_1_0_0.map((item) => item.id);
  if (request.advisorIds.some((id, index) => id !== expected[index])) context.addIssue({ code: "custom", path: ["advisorIds"], message: "Advisor IDs must use the frozen role order" });
});
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;

async function readBoundedJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; tooLarge: boolean }> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) return { ok: false, tooLarge: true };
  if (!request.body) return { ok: false, tooLarge: false };
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > MAX_REQUEST_BYTES) { await reader.cancel(); return { ok: false, tooLarge: true }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch { return { ok: false, tooLarge: false }; }
}

export async function POST(request: Request) {
  const body = await readBoundedJson(request);
  if (!body.ok) return json({ error: body.tooLarge ? "request_too_large" : "invalid_request" }, body.tooLarge ? 413 : 400);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return json({ error: "invalid_request" }, 400);
  const parsed = requestSchema.safeParse(body.value);
  if (!parsed.success) return json({ error: "invalid_request" }, 400);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rawClientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
  const rate = advisorRateLimiter.check(rawClientKey);
  if (!rate.allowed) return json({ error: "rate_limited" }, 429, { "Retry-After": String(rate.retryAfterSeconds) });
  const outcomes = await Promise.all(EXABYTES_ADVISORS_1_0_0.map((definition) => reviewWithConfiguredModel(definition, parsed.data.context)));
  const response = advisorPanelResponseSchema.safeParse({
    reviews: outcomes.map((outcome, index) => outcome.status === "success" ? outcome.review : buildExabytesFallbackReview(EXABYTES_ADVISORS_1_0_0[index], parsed.data.context, id("advisor"))),
    modelCalls: outcomes.map((outcome) => outcome.call),
  });
  if (!response.success) return json({ error: "review_unavailable" }, 503);
  return json(response.data, 200);
}
