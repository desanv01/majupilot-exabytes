import { catalogueSchema, type Catalogue } from "@/domain/recommendations";

export interface CatalogueDiff {
  fromVersion: string;
  toVersion: string;
  addedOfferingIds: string[];
  removedOfferingIds: string[];
  disabledOfferingIds: string[];
  reactivatedOfferingIds: string[];
  changedOfferingIds: string[];
  addedMappingKeys: string[];
  removedMappingKeys: string[];
}

const stable = (value: unknown) => JSON.stringify(value, (_key, nested) => {
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return nested;
  return Object.fromEntries(Object.entries(nested as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)));
});
const mappingKey = (mapping: Catalogue["mappings"][number]) => `${mapping.capabilityId}:${mapping.offeringId}:${mapping.selectionRuleId}`;

export function diffCatalogues(previousInput: unknown, nextInput: unknown): CatalogueDiff {
  const previous = catalogueSchema.parse(previousInput);
  const next = catalogueSchema.parse(nextInput);
  const previousById = new Map(previous.offerings.map((item) => [item.id, item]));
  const nextById = new Map(next.offerings.map((item) => [item.id, item]));
  const previousMappings = new Set(previous.mappings.map(mappingKey));
  const nextMappings = new Set(next.mappings.map(mappingKey));
  return {
    fromVersion: previous.version,
    toVersion: next.version,
    addedOfferingIds: [...nextById.keys()].filter((id) => !previousById.has(id)).sort(),
    removedOfferingIds: [...previousById.keys()].filter((id) => !nextById.has(id)).sort(),
    disabledOfferingIds: [...nextById].filter(([id, item]) => previousById.get(id)?.active && !item.active).map(([id]) => id).sort(),
    reactivatedOfferingIds: [...nextById].filter(([id, item]) => previousById.get(id)?.active === false && item.active).map(([id]) => id).sort(),
    changedOfferingIds: [...nextById].filter(([id, item]) => previousById.has(id) && stable(previousById.get(id)) !== stable(item)).map(([id]) => id).sort(),
    addedMappingKeys: [...nextMappings].filter((key) => !previousMappings.has(key)).sort(),
    removedMappingKeys: [...previousMappings].filter((key) => !nextMappings.has(key)).sort(),
  };
}

/** Review/disable creates a new immutable catalogue snapshot; it never mutates an activated version. */
export function disableOfferingInNewVersion(
  currentInput: unknown,
  input: { nextVersion: string; offeringId: string; verifiedAt: string },
): Catalogue {
  const current = catalogueSchema.parse(currentInput);
  if (current.version === input.nextVersion) throw new Error("catalogue_version_must_advance");
  if (!current.offerings.some((item) => item.id === input.offeringId)) throw new Error("offering_not_found");
  return catalogueSchema.parse({
    ...current,
    version: input.nextVersion,
    reviewState: "draft",
    verifiedAt: input.verifiedAt,
    offerings: current.offerings.map((item) => ({
      ...item,
      catalogueVersion: input.nextVersion,
      ...(item.id === input.offeringId ? { active: false, reviewState: "disabled" } : {}),
    })),
    mappings: current.mappings.filter((mapping) => mapping.offeringId !== input.offeringId),
  });
}
