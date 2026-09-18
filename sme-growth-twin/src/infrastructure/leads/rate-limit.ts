import "server-only";

import { createHash, randomBytes } from "node:crypto";

interface WindowRecord { count: number; resetsAt: number }

export class ProcessLocalHashedRateLimiter {
  private readonly records = new Map<string, WindowRecord>();
  private readonly salt = randomBytes(24).toString("hex");
  constructor(private readonly limit = 5, private readonly windowMs = 10 * 60_000, private readonly maxKeys = 2_000) {}

  check(rawKey: string, now = Date.now()): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
    const key = createHash("sha256").update(this.salt).update(rawKey).digest("hex");
    const existing = this.records.get(key);
    if (!existing || existing.resetsAt <= now) {
      if (this.records.size >= this.maxKeys) this.prune(now);
      this.records.set(key, { count: 1, resetsAt: now + this.windowMs });
      return { allowed: true };
    }
    if (existing.count >= this.limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetsAt - now) / 1000)) };
    existing.count += 1;
    return { allowed: true };
  }

  private prune(now: number) {
    for (const [key, record] of this.records) if (record.resetsAt <= now) this.records.delete(key);
    while (this.records.size >= this.maxKeys) this.records.delete(this.records.keys().next().value as string);
  }

  resetForTests() { this.records.clear(); }
  hashedKeysForTests() { return [...this.records.keys()]; }
}

export class ProcessLocalLeadRateLimiter extends ProcessLocalHashedRateLimiter {}

export const leadRateLimiter = new ProcessLocalLeadRateLimiter();
export const advisorRateLimiter = new ProcessLocalHashedRateLimiter(3, 10 * 60_000, 2_000);
