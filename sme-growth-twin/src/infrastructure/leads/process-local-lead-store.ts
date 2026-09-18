import "server-only";

import type { Lead } from "@/domain/leads";

import type { LeadStore, StoredLead, StoreLeadResult } from "./lead-store";

class ProcessLocalLeadStore implements LeadStore {
  private readonly records = new Map<string, StoredLead>();

  async findBySubmissionId(submissionId: string) { return this.records.get(submissionId); }

  async createIdempotently(record: StoredLead): Promise<StoreLeadResult> {
    const existing = this.records.get(record.lead.submissionId);
    if (existing) return existing.fingerprint === record.fingerprint ? { status: "replayed", lead: existing.lead } : { status: "conflict" };
    this.records.set(record.lead.submissionId, record);
    return { status: "created", lead: record.lead };
  }

  countForTests() { return this.records.size; }
  getForTests(submissionId: string): Lead | undefined { return this.records.get(submissionId)?.lead; }
  resetForTests() { this.records.clear(); }
}

export const processLocalLeadStore = new ProcessLocalLeadStore();
