import { leadReceiptSchema, type LeadReceipt } from "@/domain/leads";

export const LEAD_RECEIPT_SESSION_KEY = "sme-growth-twin:lead-receipt:1.0.0";
type SessionPort = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function saveLeadReceipt(storage: Pick<SessionPort, "setItem">, receipt: LeadReceipt) {
  storage.setItem(LEAD_RECEIPT_SESSION_KEY, JSON.stringify(leadReceiptSchema.parse(receipt)));
}

export function loadLeadReceipt(storage: Pick<SessionPort, "getItem" | "removeItem">): LeadReceipt | undefined {
  const raw = storage.getItem(LEAD_RECEIPT_SESSION_KEY); if (!raw) return undefined;
  try {
    const parsed = leadReceiptSchema.safeParse(JSON.parse(raw) as unknown);
    if (parsed.success) return parsed.data;
  } catch {}
  storage.removeItem(LEAD_RECEIPT_SESSION_KEY); return undefined;
}

export function clearLeadReceipt(storage: Pick<SessionPort, "removeItem">) { storage.removeItem(LEAD_RECEIPT_SESSION_KEY); }
