import { leadPolicySchema } from "@/domain/leads";

export const EXABYTES_CONSULTATION_POLICY = leadPolicySchema.parse({
  schemaVersion: "1.0.0",
  consentWordingVersion: "consultation-consent-1.0.0",
  consentWording: "I agree that my contact details and this assessment's Blueprint summary may be used to arrange an Exabytes consultation. I understand what will be shared and that I can request deletion.",
  sourceCampaign: "ai-horizon-2026",
  initialStatus: "new",
});
