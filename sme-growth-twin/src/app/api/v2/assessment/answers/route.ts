import { z } from "zod";
import { correlationId,errorResponse,readJson,repository,resolveOwner,response } from "@/infrastructure/persistence/api";
import { PersistenceService } from "@/core/persistence/persistence-service";
import { assessmentAnswerRecordSchema,persistenceUuidSchema } from "@/domain/persistence";
export const runtime="nodejs";const schema=z.object({organizationId:persistenceUuidSchema.optional(),answer:assessmentAnswerRecordSchema}).strict();
export async function POST(request:Request){const id=correlationId(request);try{const b=schema.parse(await readJson(request));const owner=await resolveOwner(request,b.organizationId);await new PersistenceService(repository()).saveAnswer(owner,b.answer);return response({data:{id:b.answer.id}},201,id);}catch(e){return errorResponse(e,id);}}
