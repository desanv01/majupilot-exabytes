import { z } from "zod";
import { correlationId,errorResponse,readJson,repository,resolveOwner,response } from "@/infrastructure/persistence/api";
import { PersistenceService } from "@/core/persistence/persistence-service";
import { consentAppendSchema,persistenceUuidSchema } from "@/domain/persistence";
export const runtime="nodejs";const schema=z.object({organizationId:persistenceUuidSchema.optional(),consent:consentAppendSchema}).strict();
export async function POST(request:Request){const id=correlationId(request);try{const b=schema.parse(await readJson(request,32*1024));const owner=await resolveOwner(request,b.organizationId);await new PersistenceService(repository()).appendConsent(owner,b.consent);return response({data:{id:b.consent.id}},201,id);}catch(e){return errorResponse(e,id);}}
