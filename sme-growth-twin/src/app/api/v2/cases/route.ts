import { z } from "zod";

import { persistenceUuidSchema } from "@/domain/persistence";
import { AccountCaseRepository } from "@/infrastructure/persistence/account-case-repository";
import { correlationId, errorResponse, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
const scopeSchema = z.object({ organizationId: persistenceUuidSchema }).strict();

export async function GET(request: Request) {
  const requestId = correlationId(request);
  try {
    const organizationId = scopeSchema.parse({ organizationId: new URL(request.url).searchParams.get("organizationId") }).organizationId;
    const owner = await resolveOwner(request, organizationId);
    return response({ data: await new AccountCaseRepository().list(owner) }, 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const { organizationId } = scopeSchema.parse(await readJson(request, 4096));
    const owner = await resolveOwner(request, organizationId);
    return response({ data: await new AccountCaseRepository().create(owner) }, 201, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
