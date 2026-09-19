import { z } from "zod";
import { correlationId,errorResponse,readJson,repository,resolveOwner,response } from "@/infrastructure/persistence/api";
import { PersistenceService } from "@/core/persistence/persistence-service";
import { dataRequestSchema,persistenceUuidSchema } from "@/domain/persistence";
export const runtime="nodejs";const schema=z.object({organizationId:persistenceUuidSchema.optional(),request:dataRequestSchema}).strict();
export async function POST(request:Request){const id=correlationId(request);try{const b=schema.parse(await readJson(request,16*1024));const owner=await resolveOwner(request,b.organizationId);const requestId=await new PersistenceService(repository()).requestExport(owner,b.request);return response({data:{requestId,status:"pending"}},202,id);}catch(e){return errorResponse(e,id);}}
