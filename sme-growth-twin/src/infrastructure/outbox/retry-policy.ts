import { createHash } from "node:crypto";

const BACKOFF_SECONDS = [60, 300, 900, 1_800, 3_600, 7_200, 21_600, 43_200] as const;
const MAX_RETRY_AFTER_SECONDS = 3_600;

export function deterministicRetryDelaySeconds(eventId: string, attemptNumber: number, retryAfterSeconds?: number) {
  const base = BACKOFF_SECONDS[Math.min(Math.max(attemptNumber - 1, 0), BACKOFF_SECONDS.length - 1)];
  const boundedRetryAfter = retryAfterSeconds === undefined
    ? 0
    : Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(0, Math.floor(retryAfterSeconds)));
  const seed = createHash("sha256").update(`${eventId}:${attemptNumber}`).digest().readUInt32BE(0);
  const jitter = Math.floor(base * (((seed % 2001) - 1000) / 10_000));
  return Math.max(boundedRetryAfter, Math.max(1, base + jitter));
}

export function parseBoundedRetryAfter(value: string | undefined, now = new Date()) {
  if (!value) return undefined;
  if (/^\d+$/.test(value.trim())) return Math.min(MAX_RETRY_AFTER_SECONDS, Number(value.trim()));
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return undefined;
  return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(0, Math.ceil((at - now.getTime()) / 1_000)));
}

export function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}
