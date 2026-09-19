import { z } from "zod";
import { correlationId,errorResponse,readJson,repository,resolveOwner,response } from "@/infrastructure/persistence/api";
import { PersistenceService } from "@/core/persistence/persistence-service";
import { artifactWriteSchema,persistenceUuidSchema } from "@/domain/persistence";
export const runtime="nodejs";const schema=z.object({organizationId:persistenceUuidSchema.optional(),artifact:artifactWriteSchema}).strict();
export async function POST(request:Request){const id=correlationId(request);try{const b=schema.parse(await readJson(request,512*1024));const owner=await resolveOwner(request,b.organizationId);await new PersistenceService(repository()).saveArtifact(owner,b.artifact);return response({data:{id:b.artifact.id,kind:b.artifact.kind}},201,id);}catch(e){return errorResponse(e,id);}}
