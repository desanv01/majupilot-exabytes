import type { VersionMetadata } from "./versioning";

/**
 * Domain-specific knowledge is supplied through this boundary. The core never
 * imports an Exabytes implementation directly.
 */
export interface DomainPack<TKnowledge> {
  readonly id: string;
  readonly displayName: string;
  readonly versions: VersionMetadata;
  readonly knowledge: TKnowledge;
  parseKnowledge(input: unknown): TKnowledge;
}
