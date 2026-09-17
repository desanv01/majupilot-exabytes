import {
  offeringSelectionPolicySchema,
  type OfferingSelectionPolicy,
} from "@/domain/recommendations";

/** Provider-specific deterministic selection policy for Catalogue 1.0.0. */
export const EXABYTES_OFFERING_SELECTION_1_0_0: OfferingSelectionPolicy =
  offeringSelectionPolicySchema.parse({
    rules: [
      {
        id: "exabytes_rule_1_freshsales",
        capabilityId: "shared_customer_operations",
        offeringId: "exb_freshsales_crm",
        priority: 100,
        conditions: [],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_rule_2_acronis",
        capabilityId: "protected_business_continuity",
        offeringId: "exb_acronis_cyber_protect",
        priority: 100,
        conditions: [],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_rule_3_email_cost",
        capabilityId: "professional_team_collaboration",
        offeringId: "exb_business_email",
        priority: 100,
        conditions: [
          { source: "capability_state", key: "businessEmail", operator: "in", values: ["not_used"] },
          { source: "constraint_concern", operator: "in", values: ["cost"] },
        ],
        alternativeOfferingIds: ["exb_lark", "exb_google_workspace", "exb_microsoft_365"],
      },
      {
        id: "exabytes_rule_3_lark_coordination",
        capabilityId: "professional_team_collaboration",
        offeringId: "exb_lark",
        priority: 90,
        conditions: [
          { source: "challenge", operator: "in", values: ["team_collaboration"] },
          { source: "capability_state", key: "businessEmail", operator: "not_in", values: ["not_used"] },
        ],
        alternativeOfferingIds: ["exb_business_email", "exb_google_workspace", "exb_microsoft_365"],
      },
      {
        id: "exabytes_rule_3_email_fallback",
        capabilityId: "professional_team_collaboration",
        offeringId: "exb_business_email",
        priority: 10,
        conditions: [],
        alternativeOfferingIds: ["exb_lark", "exb_google_workspace", "exb_microsoft_365"],
      },
      {
        id: "exabytes_rule_4_hosting",
        capabilityId: "measurable_digital_growth",
        offeringId: "exb_ai_business_hosting",
        priority: 100,
        conditions: [
          { source: "capability_state", key: "websiteOrStore", operator: "in", values: ["not_used", "informal"] },
        ],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_rule_5_cloudflare",
        capabilityId: "protected_web_presence",
        offeringId: "exb_cloudflare_managed",
        priority: 100,
        conditions: [
          { source: "capability_state", key: "websiteOrStore", operator: "in", values: ["active"] },
          { source: "capability_state", key: "cybersecurityControls", operator: "in", values: ["not_used", "informal"] },
        ],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_rule_6_vision_cloud",
        capabilityId: "scalable_cloud_operations",
        offeringId: "exb_vision_cloud",
        priority: 100,
        conditions: [
          { source: "challenge", operator: "in", values: ["scaling_operations"] },
        ],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_rule_7_ai_cloud",
        capabilityId: "governed_ai_automation",
        offeringId: "exb_ai_cloud",
        priority: 100,
        conditions: [],
        alternativeOfferingIds: ["exb_eva"],
      },
    ],
  });
