import { z } from "zod";

export const semanticVersionSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Expected a semantic version");

export const versionMetadataSchema = z
  .object({
    schemaVersion: semanticVersionSchema,
    rulesVersion: semanticVersionSchema,
    catalogueVersion: semanticVersionSchema,
  })
  .strict();

export type VersionMetadata = z.infer<typeof versionMetadataSchema>;
