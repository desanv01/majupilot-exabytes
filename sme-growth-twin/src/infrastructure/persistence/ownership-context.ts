import { ownershipContextSchema, type OwnershipContext } from "@/domain/persistence";
export const parseOwnershipContext = (value: unknown): OwnershipContext => ownershipContextSchema.parse(value);
