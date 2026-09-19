import { NextResponse } from "next/server";
import { z } from "zod";
import { PersistenceError,persistenceUuidSchema } from "@/domain/persistence";
import { correlationId,errorResponse,NO_STORE_HEADERS,readJson,repository } from "@/infrastructure/persistence/api";
import { digestGuestToken,GUEST_COOKIE_NAME,GUEST_COOKIE_OPTIONS } from "@/infrastructure/persistence/guest-session-token";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server";
export const runtime="nodejs";
const schema=z.object({organizationId:persistenceUuidSchema}).strict();
export async function POST(request:Request){const id=correlationId(request);try{const body=schema.parse(await readJson(request,8*1024));const token=request.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith(`${GUEST_COOKIE_NAME}=`))?.slice(GUEST_COOKIE_NAME.length+1);if(!token)throw new PersistenceError("UNAUTHENTICATED",401);const client=await createServerSupabaseClient();const{data,error}=await client.auth.getUser();if(error||!data.user)throw new PersistenceError("UNAUTHENTICATED",401);const receipt=await repository().claimGuest(digestGuestToken(decodeURIComponent(token)),data.user.id,body.organizationId);const r=NextResponse.json({data:receipt},{headers:{...NO_STORE_HEADERS,"X-Correlation-ID":id}});r.cookies.set(GUEST_COOKIE_NAME,"",{...GUEST_COOKIE_OPTIONS,maxAge:0});return r;}catch(e){return errorResponse(e,id);}}
