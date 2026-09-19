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

/** Catalogue 2.0.0 expands verified paths without changing capability ranking. */
export const EXABYTES_OFFERING_SELECTION_2_0_0: OfferingSelectionPolicy =
  offeringSelectionPolicySchema.parse({
    rules: [
      {
        id: "exabytes_v2_freshsales",
        capabilityId: "shared_customer_operations",
        offeringId: "exb_freshsales_crm",
        priority: 100,
        conditions: [],
        alternativeOfferingIds: ["exb_freshdesk", "exb_freshchat", "exb_managed_ecommerce", "exb_ai_sales_team"],
      },
      {
        id: "exabytes_v2_acronis",
        capabilityId: "protected_business_continuity",
        offeringId: "exb_acronis_cyber_protect",
        priority: 100,
        conditions: [],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_v2_meeting_ai",
        capabilityId: "professional_team_collaboration",
        offeringId: "exb_meeting_ai",
        priority: 130,
        conditions: [
          { source: "challenge", operator: "in", values: ["team_collaboration"] },
          { source: "capability_state", key: "aiTools", operator: "in", values: ["informal", "active"] },
        ],
        alternativeOfferingIds: ["exb_lark", "exb_google_workspace", "exb_microsoft_365", "exb_business_email"],
      },
      {
        id: "exabytes_v2_email_cost",
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
        id: "exabytes_v2_lark_coordination",
        capabilityId: "professional_team_collaboration",
        offeringId: "exb_lark",
        priority: 90,
        conditions: [
          { source: "challenge", operator: "in", values: ["team_collaboration"] },
          { source: "capability_state", key: "businessEmail", operator: "not_in", values: ["not_used"] },
        ],
        alternativeOfferingIds: ["exb_business_email", "exb_google_workspace", "exb_microsoft_365", "exb_meeting_ai"],
      },
      {
        id: "exabytes_v2_email_fallback",
        capabilityId: "professional_team_collaboration",
        offeringId: "exb_business_email",
        priority: 10,
        conditions: [],
        alternativeOfferingIds: ["exb_lark", "exb_google_workspace", "exb_microsoft_365"],
      },
      {
        id: "exabytes_v2_managed_ecommerce",
        capabilityId: "measurable_digital_growth",
        offeringId: "exb_managed_ecommerce",
        priority: 140,
        conditions: [
          { source: "challenge", operator: "in", values: ["lead_generation"] },
          { source: "capability_state", key: "websiteOrStore", operator: "in", values: ["active"] },
        ],
        alternativeOfferingIds: ["exb_shopify_partner_path", "exb_freshmarketer"],
      },
      {
        id: "exabytes_v2_wp_hosting",
        capabilityId: "measurable_digital_growth",
        offeringId: "exb_ai_wp_hosting",
        priority: 120,
        conditions: [
          { source: "challenge", operator: "in", values: ["lead_generation"] },
          { source: "capability_state", key: "websiteOrStore", operator: "in", values: ["not_used", "informal"] },
        ],
        alternativeOfferingIds: ["exb_ai_business_hosting", "exb_ai_website_builder_path", "exb_shopify_partner_path"],
      },
      {
        id: "exabytes_v2_business_hosting",
        capabilityId: "measurable_digital_growth",
        offeringId: "exb_ai_business_hosting",
        priority: 100,
        conditions: [
          { source: "capability_state", key: "websiteOrStore", operator: "in", values: ["not_used", "informal"] },
        ],
        alternativeOfferingIds: ["exb_ai_wp_hosting", "exb_ai_website_builder_path"],
      },
      {
        id: "exabytes_v2_cloudflare",
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
        id: "exabytes_v2_vision_cloud",
        capabilityId: "scalable_cloud_operations",
        offeringId: "exb_vision_cloud",
        priority: 100,
        conditions: [{ source: "challenge", operator: "in", values: ["scaling_operations"] }],
        alternativeOfferingIds: [],
      },
      {
        id: "exabytes_v2_ai_sales_leads",
        capabilityId: "governed_ai_automation",
        offeringId: "exb_ai_sales_team",
        priority: 150,
        conditions: [{ source: "challenge", operator: "in", values: ["lead_generation"] }],
        alternativeOfferingIds: ["exb_ai_cloud", "exb_eva", "exb_bespoke_ai_consultation"],
      },
      {
        id: "exabytes_v2_ai_sales_customer",
        capabilityId: "governed_ai_automation",
        offeringId: "exb_ai_sales_team",
        priority: 145,
        conditions: [{ source: "challenge", operator: "in", values: ["customer_management"] }],
        alternativeOfferingIds: ["exb_ai_cloud", "exb_eva", "exb_bespoke_ai_consultation"],
      },
      {
        id: "exabytes_v2_meeting_ai_governed",
        capabilityId: "governed_ai_automation",
        offeringId: "exb_meeting_ai",
        priority: 140,
        conditions: [{ source: "challenge", operator: "in", values: ["team_collaboration"] }],
        alternativeOfferingIds: ["exb_ai_cloud", "exb_eva", "exb_bespoke_ai_consultation"],
      },
      {
        id: "exabytes_v2_ai_cloud",
        capabilityId: "governed_ai_automation",
        offeringId: "exb_ai_cloud",
        priority: 100,
        conditions: [],
        alternativeOfferingIds: ["exb_eva", "exb_ai_sales_team", "exb_ai_marketing_team", "exb_meeting_ai", "exb_bespoke_ai_consultation"],
      },
    ],
  });

export const EXABYTES_OFFERING_SELECTION_CURRENT = EXABYTES_OFFERING_SELECTION_2_0_0;
