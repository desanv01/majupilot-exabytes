import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";

import { canonicalJson } from "@/core/reports/canonical-json";
import { outboxEnvelopeSchema, type ClaimedOutboxItem, type DeliveryResult } from "@/domain/workflow-outbox";
import { isRetryableStatus, parseBoundedRetryAfter } from "./retry-policy";
import { isPublicAddress, validateWebhookUrl } from "./webhook-security";

export type WebhookAdapterConfig = {
  url: string;
  secret: string;
  keyId?: string;
  allowedHosts?: readonly string[];
  allowInsecureLocalTest?: boolean;
  timeoutMs?: number;
};

const WEBHOOK_CONFIGURATION_ERROR_CODES = new Set([
  "WEBHOOK_HTTPS_REQUIRED",
  "WEBHOOK_CREDENTIALS_FORBIDDEN",
  "WEBHOOK_HOST_NOT_ALLOWED",
  "WEBHOOK_PRIVATE_ADDRESS",
  "WEBHOOK_SECRET_INVALID",
]);

function redactedConfigurationErrorCode(error: unknown) {
  if (error instanceof Error && WEBHOOK_CONFIGURATION_ERROR_CODES.has(error.message)) return error.message;
  return "WEBHOOK_CONFIG_INVALID";
}

export class SignedWebhookAdapter {
  constructor(private readonly config: WebhookAdapterConfig) {}

  async deliver(item: ClaimedOutboxItem): Promise<DeliveryResult> {
    let validated: ReturnType<typeof validateWebhookUrl>;
    try {
      validated = validateWebhookUrl(this.config.url, this.config.allowedHosts, this.config.allowInsecureLocalTest);
      if (this.config.secret.length < 32) throw new Error("WEBHOOK_SECRET_INVALID");
    } catch (error) {
      return { outcome: "dead_letter", errorCategory: "configuration", errorCode: redactedConfigurationErrorCode(error) };
    }

    const resolved = await lookup(validated.url.hostname, { all: true, verbatim: true }).catch(() => []);
    if (resolved.length === 0) return { outcome: "retry", errorCategory: "network", errorCode: "DNS_LOOKUP_FAILED" };
    if (!validated.localTest && resolved.some(({ address }) => !isPublicAddress(address))) {
      return { outcome: "dead_letter", errorCategory: "configuration", errorCode: "WEBHOOK_PRIVATE_ADDRESS" };
    }

    const envelope = outboxEnvelopeSchema.parse({
      eventId: item.id,
      eventType: item.event_type,
      eventVersion: item.event_version,
      occurredAt: item.created_at,
      aggregateId: item.aggregate_id,
      idempotencyKey: item.idempotency_key,
      data: item.payload,
    });
    const body = canonicalJson(envelope);
    const timestamp = Math.floor(Date.now() / 1_000).toString();
    const signature = createHmac("sha256", this.config.secret).update(`${timestamp}.${body}`).digest("hex");
    const pinned = resolved.map(({ address }) => address);

    return new Promise((resolve) => {
      const client = validated.url.protocol === "https:" ? https : http;
      const request = client.request(validated.url, {
        method: "POST",
        timeout: this.config.timeoutMs ?? 10_000,
        servername: validated.url.hostname,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
          "x-majupilot-timestamp": timestamp,
          "x-majupilot-signature": `sha256=${signature}`,
          ...(this.config.keyId ? { "x-majupilot-key-id": this.config.keyId } : {}),
          "idempotency-key": item.idempotency_key,
        },
        lookup: (_hostname, options, callback) => {
          const address = pinned[0];
          const family = address.includes(":") ? 6 : 4;
          if (typeof options === "object" && options.all) {
            (callback as unknown as (error: NodeJS.ErrnoException | null, addresses: Array<{ address: string; family: number }>) => void)(null, [{ address, family }]);
            return;
          }
          (callback as unknown as (error: NodeJS.ErrnoException | null, resolvedAddress: string, resolvedFamily: number) => void)(null, address, family);
        },
      }, (response) => {
        response.resume();
        const status = response.statusCode ?? 0;
        const rawRequestId = response.headers["x-request-id"]?.toString();
        const providerRequestId = rawRequestId && /^[A-Za-z0-9_.:-]{1,160}$/.test(rawRequestId) ? rawRequestId : undefined;
        if (status >= 200 && status < 300) return resolve({ outcome: "succeeded", statusCode: status, providerRequestId });
        if (isRetryableStatus(status)) return resolve({
          outcome: "retry", statusCode: status, providerRequestId, errorCategory: "provider", errorCode: `HTTP_${status}`,
          retryAfterSeconds: parseBoundedRetryAfter(response.headers["retry-after"]?.toString()),
        });
        return resolve({ outcome: "dead_letter", statusCode: status, providerRequestId, errorCategory: "provider", errorCode: `HTTP_${status}` });
      });
      request.on("timeout", () => request.destroy(new Error("WEBHOOK_TIMEOUT")));
      request.on("error", (error: Error & { code?: string }) => resolve({
        outcome: "retry", errorCategory: "network",
        errorCode: error.code && /^[A-Z0-9_]{2,40}$/.test(error.code) ? error.code : "WEBHOOK_NETWORK_ERROR",
      }));
      request.end(body);
    });
  }

  static verifyForTest(body: string, timestamp: string, signature: string, secret: string) {
    const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const actual = signature.replace(/^sha256=/, "");
    return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  }
}
