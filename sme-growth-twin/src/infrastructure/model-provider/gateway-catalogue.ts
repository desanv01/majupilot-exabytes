import "server-only";

import { AiExecutionError } from "@/domain/ai-execution";
import type { AiOperationPolicy } from "./ai-execution-policy";

const CATALOGUE_URL = "https://ai-gateway.vercel.sh/v1/models";
const CACHE_MS = 5 * 60_000;

const catalogueModelSchema = (value: unknown): value is GatewayModel => {
  if (!value || typeof value !== "object") return false;
  const model = value as Record<string, unknown>;
  return typeof model.id === "string" && model.type === "language" && typeof model.max_tokens === "number" && Array.isArray(model.supported_parameters);
};

export interface GatewayModel {
  id: string;
  type: "language";
  max_tokens: number;
  supported_parameters: string[];
  modalities?: { input?: string[]; output?: string[] };
  pricing?: { input?: string; output?: string };
}

let cache: { expiresAt: number; models: GatewayModel[] } | undefined;

export async function fetchGatewayCatalogue(fetcher: typeof fetch = fetch): Promise<GatewayModel[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.models;
  let response: Response;
  try {
    response = await fetcher(CATALOGUE_URL, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5_000) });
  } catch {
    throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, true);
  }
  if (!response.ok) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, true);
  const body = (await response.json()) as { data?: unknown };
  if (!Array.isArray(body.data)) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, true);
  const models = body.data.filter(catalogueModelSchema);
  cache = { models, expiresAt: Date.now() + CACHE_MS };
  return models;
}

export async function preflightModel(policy: AiOperationPolicy, fetcher: typeof fetch = fetch): Promise<GatewayModel> {
  if (!policy.model) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
  const model = (await fetchGatewayCatalogue(fetcher)).find((candidate) => candidate.id === policy.model);
  if (!model || model.max_tokens < policy.maxOutputTokens || !model.supported_parameters.includes("max_tokens")) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
  if (!model.modalities?.input?.includes("text") || !model.modalities.output?.includes("text")) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
  return model;
}

export function resetGatewayCatalogueCacheForTests() {
  cache = undefined;
}
