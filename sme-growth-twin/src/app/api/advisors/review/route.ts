import { z } from "zod";

import { advisorIdSchema, advisorPanelResponseSchema, advisorReviewContextSchema } from "@/domain/advisors";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "@/domain-packs/exabytes/advisor-rules";
import { reviewWithConfiguredModel } from "@/infrastructure/model-provider/advisor-model-review";

export const runtime = "nodejs";

const requestSchema = z.object({ context: advisorReviewContextSchema, advisorIds: z.array(advisorIdSchema).length(5) }).strict().superRefine((request, context) => {
  if (new Set(request.advisorIds).size !== request.advisorIds.length) context.addIssue({ code: "custom", path: ["advisorIds"], message: "Advisor IDs must be unique" });
  const expected = EXABYTES_ADVISORS_1_0_0.map((item) => item.id);
  if (request.advisorIds.some((id, index) => id !== expected[index])) context.addIssue({ code: "custom", path: ["advisorIds"], message: "Advisor IDs must use the frozen role order" });
});
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: "invalid_request" }, { status: 400 }); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const outcomes = await Promise.all(EXABYTES_ADVISORS_1_0_0.map((definition) => reviewWithConfiguredModel(definition, parsed.data.context)));
  const response = advisorPanelResponseSchema.safeParse({
    reviews: outcomes.map((outcome, index) => outcome.status === "success" ? outcome.review : buildExabytesFallbackReview(EXABYTES_ADVISORS_1_0_0[index], parsed.data.context, id("advisor"))),
    modelCalls: outcomes.map((outcome) => outcome.call),
  });
  if (!response.success) return Response.json({ error: "review_unavailable" }, { status: 503 });
  return Response.json(response.data, { headers: { "Cache-Control": "no-store" } });
}
