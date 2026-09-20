import { timingSafeEqual } from "node:crypto";

import { OutboxWorker } from "@/infrastructure/outbox/outbox-worker";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const value = request.headers.get("authorization");
  if (!secret || !value?.startsWith("Bearer ")) return false;
  const supplied = value.slice("Bearer ".length);
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: { code: "UNAUTHENTICATED" } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const workerId = `vercel-cron:${crypto.randomUUID()}`;
  const data = await new OutboxWorker().processBatch(workerId, 10);
  return Response.json({ data }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
