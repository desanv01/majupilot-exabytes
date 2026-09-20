import { z } from "zod";

import { PersistenceError } from "@/domain/persistence";
import { SupabaseOutboxRepository } from "@/infrastructure/outbox/supabase-outbox-repository";
import { correlationId, errorResponse, readJson, response } from "@/infrastructure/persistence/api";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

export const runtime = "nodejs";
const inputSchema = z.object({ replayKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/) }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const { id } = await context.params;
    z.uuid().parse(id);
    const input = inputSchema.parse(await readJson(request, 2_048));
    const auth = await (await createServerSupabaseClient()).auth.getUser();
    if (!auth.data.user) throw new PersistenceError("UNAUTHENTICATED", 401);
    const repository = new SupabaseOutboxRepository();
    await repository.assertOperator(auth.data.user.id);
    return response({ data: await repository.replay(id, input.replayKey, requestId) }, 201, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
