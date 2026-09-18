import "server-only";

import type { Lead } from "@/domain/leads";

export interface StoredLead { readonly fingerprint: string; readonly lead: Lead }
export type StoreLeadResult = { status: "created"; lead: Lead } | { status: "replayed"; lead: Lead } | { status: "conflict" };

export interface LeadStore {
  findBySubmissionId(submissionId: string): Promise<StoredLead | undefined>;
  createIdempotently(record: StoredLead): Promise<StoreLeadResult>;
}
