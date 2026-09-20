import { z } from "zod";

import { PersistenceError } from "@/domain/persistence";
import { OutboxWorker } from "@/infrastructure/outbox/outbox-worker";
import { SupabaseOutboxRepository } from "@/infrastructure/outbox/supabase-outbox-repository";
import { correlationId, errorResponse, readJson, response } from "@/infrastructure/persistence/api";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

export const runtime = "nodejs";
const inputSchema = z.object({ limit: z.number().int().min(1).max(25).default(10) }).strict();

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = inputSchema.parse(await readJson(request, 2_048));
    const auth = await (await createServerSupabaseClient()).auth.getUser();
    if (!auth.data.user) throw new PersistenceError("UNAUTHENTICATED", 401);
    const repository = new SupabaseOutboxRepository();
    await repository.assertOperator(auth.data.user.id);
    return response({ data: await new OutboxWorker(repository).processBatch(`operator:${auth.data.user.id}:${requestId}`, input.limit) }, 200, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
