import { z } from "zod";

import { AiExecutionError } from "@/domain/ai-execution";
import { copilotTurnRequestSchema } from "@/domain/copilot";
import { PersistenceError } from "@/domain/persistence";
import { executeCopilotTurn } from "@/infrastructure/copilot/copilot-model";
import { SupabaseCopilotRepository } from "@/infrastructure/copilot/supabase-copilot-repository";
import { correlationId, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";
import { copilotErrorResponse } from "@/infrastructure/copilot/copilot-errors";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const sessionId = z.uuid().parse((await params).id);
    const input = copilotTurnRequestSchema.parse(await readJson(request, 24 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
    if (request.headers.get("accept")?.includes("application/x-ndjson")) {
      const startedAt = Date.now();
      let phase = "starting";
      const encoder = new TextEncoder();
      const executionController = new AbortController();
      const abortExecution = () => executionController.abort("copilot_stream_cancelled");
      if (request.signal.aborted) abortExecution();
      else request.signal.addEventListener("abort", abortExecution, { once: true });
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          let closed = false;
          const write = (event: Record<string, unknown>) => {
            if (closed) return;
            try { controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); }
            catch { closed = true; }
          };
          const close = () => {
            if (closed) return;
            closed = true;
            request.signal.removeEventListener("abort", abortExecution);
            try { controller.close(); } catch { /* client disconnected */ }
          };
          void executeCopilotTurn({
            owner,
            sessionId,
            request: input,
            repository: new SupabaseCopilotRepository(),
            clientKey,
            signal: executionController.signal,
            onEvent: (event) => {
              if (event.type === "status") phase = event.phase;
              else if (event.type === "text_delta") phase = "streaming";
              write(event);
            },
          }).then((data) => { write({ type: "completed", data }); close(); }).catch(async (error) => {
            const failure = copilotErrorResponse(error, requestId);
            const body = await failure.json() as { error?: Record<string, unknown> };
            console.error(JSON.stringify({
              level: "error",
              event: "copilot.stream.failed",
              requestId,
              code: body.error?.code ?? "INTERNAL_RETRYABLE",
              category: body.error?.category ?? "persistence_failure",
              errorClass: error instanceof AiExecutionError ? "AiExecutionError"
                : error instanceof PersistenceError ? "PersistenceError"
                  : error instanceof z.ZodError ? "ZodError" : "UnknownError",
              phase,
              durationMs: Date.now() - startedAt,
            }));
            write({ type: "error", error: body.error ?? { code: "INTERNAL_RETRYABLE", requestId, retryable: true } });
            close();
          });
        },
        cancel() {
          abortExecution();
          request.signal.removeEventListener("abort", abortExecution);
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
          "X-Correlation-Id": requestId,
        },
      });
    }
    const data = await executeCopilotTurn({ owner, sessionId, request: input, repository: new SupabaseCopilotRepository(), clientKey, signal: request.signal });
    return response({ data }, 200, requestId);
  } catch (error) {
    return copilotErrorResponse(error, requestId);
  }
}
