import type { EmailOtpType } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/infrastructure/supabase/server";

const allowedOtpTypes = new Set<EmailOtpType>(["email", "magiclink", "signup", "invite", "recovery"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const client = await createServerSupabaseClient();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  let succeeded = false;

  if (tokenHash && type && allowedOtpTypes.has(type)) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    succeeded = !error;
  } else if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    succeeded = !error;
  }

  // Supabase's implicit recovery flow returns tokens in a URL fragment, which
  // the server cannot read. The browser carries that fragment to /cases.
  const destination = new URL(
    succeeded ? (type === "recovery" ? "/cases?auth=recovery" : "/cases")
      : !tokenHash && !code ? "/cases?auth=callback" : "/cases?auth=expired",
    url.origin,
  );
  return Response.redirect(destination, 303);
}
