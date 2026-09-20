import { createServer, type RequestListener, type Server } from "node:http";
import { once } from "node:events";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ClaimedOutboxItem } from "@/domain/workflow-outbox";
import { canonicalJson } from "@/core/reports/canonical-json";
import { OutboxWorker } from "@/infrastructure/outbox/outbox-worker";
import { deterministicRetryDelaySeconds, parseBoundedRetryAfter } from "@/infrastructure/outbox/retry-policy";
import { SignedWebhookAdapter } from "@/infrastructure/outbox/signed-webhook-adapter";
import type { SupabaseOutboxRepository } from "@/infrastructure/outbox/supabase-outbox-repository";
import { isPublicAddress, validateWebhookUrl } from "@/infrastructure/outbox/webhook-security";

const item: ClaimedOutboxItem = {
  id: "10000000-0000-4000-8000-000000000001",
  aggregate_type: "lead",
  aggregate_id: "20000000-0000-4000-8000-000000000001",
  event_type: "lead.consultation_requested",
  event_version: "1.0.0",
  idempotency_key: "phase-h-delivery-0001",
  correlation_id: "phase-h-correlation",
  adapter_key: "signed_webhook",
  destination_key: "primary",
  state: "leased",
  attempt_count: 1,
  max_attempts: 8,
  payload: { leadId: "20000000-0000-4000-8000-000000000001", status: "assigned" },
  payload_sha256: "a".repeat(64),
  created_at: "2026-09-20T00:00:00.000Z",
  lease_owner: "test-worker",
};

let server: Server | undefined;
afterEach(() => { server?.close(); server = undefined; vi.unstubAllEnvs(); });

async function localServer(handler: RequestListener) {
  server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server unavailable");
  return `http://127.0.0.1:${address.port}/delivery`;
}

describe("Phase H deterministic outbox policy", () => {
  it("derives stable bounded jitter and Retry-After", () => {
    expect(deterministicRetryDelaySeconds(item.id, 1)).toBe(deterministicRetryDelaySeconds(item.id, 1));
    expect(deterministicRetryDelaySeconds(item.id, 2)).toBeGreaterThan(250);
    expect(parseBoundedRetryAfter("99999")).toBe(3_600);
  });

  it("rejects non-HTTPS, non-allowlisted, and private destinations", () => {
    expect(() => validateWebhookUrl("http://example.com/hook", ["example.com"])).toThrow("WEBHOOK_HTTPS_REQUIRED");
    expect(() => validateWebhookUrl("https://other.example/hook", ["example.com"])).toThrow("WEBHOOK_HOST_NOT_ALLOWED");
    expect(() => validateWebhookUrl("https://127.0.0.1/hook", ["127.0.0.1"])).toThrow("WEBHOOK_PRIVATE_ADDRESS");
    expect(isPublicAddress("169.254.169.254")).toBe(false);
    expect(isPublicAddress("::ffff:127.0.0.1")).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
  });

  it("finalizes a malformed configured URL with a redacted terminal failure", async () => {
    vi.stubEnv("OUTBOX_WEBHOOK_URL", "https://user:password@[::1/hook?token=query-secret");
    vi.stubEnv("OUTBOX_WEBHOOK_SECRET", "environment-secret-that-must-not-be-exposed");
    const finish = vi.fn().mockResolvedValue(undefined);
    const repository = {
      claim: vi.fn().mockResolvedValue([{ ...item, payload: { confidential: "payload-secret" } }]),
      finish,
    } as unknown as SupabaseOutboxRepository;

    const result = await new OutboxWorker(repository).processBatch("test-worker", 1);

    expect(finish).toHaveBeenCalledOnce();
    expect(finish.mock.calls[0][2]).toEqual({
      outcome: "dead_letter",
      errorCategory: "configuration",
      errorCode: "WEBHOOK_CONFIG_INVALID",
    });
    expect(result).toEqual({ claimed: 1, outcomes: [{ eventId: item.id, outcome: "dead_letter" }] });
    expect(JSON.stringify({ delivery: finish.mock.calls[0][2], result })).not.toMatch(/password|query-secret|environment-secret|payload-secret/);
  });

  it("sends a canonical signed envelope and preserves the delivery idempotency key", async () => {
    let captured: { body: string; timestamp: string; signature: string; idempotency: string } | undefined;
    const url = await localServer((request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.on("end", () => {
        captured = {
          body: Buffer.concat(chunks).toString("utf8"),
          timestamp: String(request.headers["x-majupilot-timestamp"]),
          signature: String(request.headers["x-majupilot-signature"]),
          idempotency: String(request.headers["idempotency-key"]),
        };
        response.writeHead(202, { "x-request-id": "safe-provider-id" }); response.end();
      });
    });
    const secret = "test-secret-that-is-at-least-32-bytes-long";
    const result = await new SignedWebhookAdapter({ url, secret, allowedHosts: ["127.0.0.1"], allowInsecureLocalTest: true }).deliver(item);
    expect(result).toMatchObject({ outcome: "succeeded", statusCode: 202, providerRequestId: "safe-provider-id" });
    expect(captured?.idempotency).toBe(item.idempotency_key);
    expect(SignedWebhookAdapter.verifyForTest(captured!.body, captured!.timestamp, captured!.signature, secret)).toBe(true);
    const parsed = JSON.parse(captured!.body);
    expect(captured!.body).toBe(canonicalJson(parsed));
    expect(parsed.data).not.toHaveProperty("contact");
  });

  it("classifies bounded retry and permanent dead-letter responses", async () => {
    const retryUrl = await localServer((_request, response) => { response.writeHead(429, { "retry-after": "99999" }); response.end("sensitive response ignored"); });
    const retry = await new SignedWebhookAdapter({ url: retryUrl, secret: "test-secret-that-is-at-least-32-bytes-long", allowedHosts: ["127.0.0.1"], allowInsecureLocalTest: true }).deliver(item);
    expect(retry).toMatchObject({ outcome: "retry", statusCode: 429, retryAfterSeconds: 3_600 });
    const retryServer = server;
    if (!retryServer) throw new Error("test server unavailable");
    retryServer.close(); await once(retryServer, "close"); server = undefined;
    const deadUrl = await localServer((_request, response) => { response.writeHead(422); response.end(); });
    const dead = await new SignedWebhookAdapter({ url: deadUrl, secret: "test-secret-that-is-at-least-32-bytes-long", allowedHosts: ["127.0.0.1"], allowInsecureLocalTest: true }).deliver(item);
    expect(dead).toMatchObject({ outcome: "dead_letter", statusCode: 422, errorCode: "HTTP_422" });
  });
});
