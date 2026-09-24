import "server-only";

import { hasGatewayCredential } from "@/infrastructure/model-provider/ai-execution-policy";

export function documentRagCapabilityStatus() {
  return {
    capability: "implemented" as const,
    embeddingGatewayCredentialPresent: hasGatewayCredential(),
    liveEmbeddingCheck: "not_performed" as const,
  };
}
