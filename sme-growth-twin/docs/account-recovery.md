# Account case recovery

The `/cases` flow uses Supabase email OTP links. Its browser client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server routes validate the current user with `auth.getUser()`, check active organization membership, and verify the case belongs to that organization before using the service-role repository.

## Hosted Auth setup

1. Enable email authentication and email OTP / magic links for the Supabase project.
2. Set the Auth Site URL to the deployed MajuPilot origin.
3. Add the deployed `/auth/confirm` URL and local development `/auth/confirm` URL to the Auth redirect allowlist. The browser supplies the exact current origin as `emailRedirectTo`.
4. Ensure the email template redirects to `/auth/confirm`. The callback accepts a PKCE `code` from the standard link or a `token_hash` plus `type` from a custom template. For a custom template, use Supabase's `{{ .TokenHash }}` with `type=email`, and point the link at the allowed `/auth/confirm` URL.
5. Apply `20260924022616_account_cases.sql`, `20260924030200_personal_workspace_rls.sql`, and `20260924031000_claim_case_related_owners.sql` in order before enabling the UI. Do not expose the secret key in any `NEXT_PUBLIC_` variable.

## Recovery behavior

- Guest work stays on the current device until the user chooses **Add this browser's work**. If a durable guest case exists, the claim transaction moves it into the user's personal workspace; the local snapshot is then saved against the claimed case ID. A failed snapshot save can retry on that same case.
- Each account case has its own server snapshot with a revision. A stale revision returns a conflict and does not overwrite another device's edits.
- Opening another case or starting a new one waits for a successful save of the active case. Unsaved guest work blocks switching until it is added to the account.
- Signing out clears cached account case data on this device after saving. Server records remain. A guest draft that has not been added stays in browser storage.
- The case snapshot contains local assessment and derived stage records. Evidence documents, Copilot history, reports, and consultation records remain in their existing case-scoped server tables. The snapshot's durable IDs reconnect those records after restore.
