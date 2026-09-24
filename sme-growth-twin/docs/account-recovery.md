# Account case recovery

The `/cases` flow uses Supabase email and password authentication. New accounts confirm their address once; later sign-ins use a password without sending an email. Existing users who entered through a magic link can set a password from their signed-in Saved cases page. Password recovery still sends an email link. The browser client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server routes validate the current user with `auth.getUser()`, check active organization membership, and verify the case belongs to that organization before using the service-role repository.

## Hosted Auth setup

1. Enable email authentication, user signups, and email confirmation for the Supabase project.
2. Set the Auth Site URL to the deployed MajuPilot origin.
3. Add the deployed `/auth/confirm` URL and local development `/auth/confirm` URL to the Auth redirect allowlist. The browser supplies the exact current origin as `emailRedirectTo`.
4. Ensure the sign-up confirmation and password recovery templates redirect to `/auth/confirm`. The callback accepts a PKCE `code` from the standard link or a `token_hash` plus `type` from a custom template. For a custom template, use Supabase's `{{ .TokenHash }}` with the corresponding `type=signup` or `type=recovery`.
5. Apply `20260924022616_account_cases.sql`, `20260924030200_personal_workspace_rls.sql`, and `20260924031000_claim_case_related_owners.sql` in order before enabling the UI. Do not expose the secret key in any `NEXT_PUBLIC_` variable.
6. Set `NEXT_PUBLIC_SUPABASE_URL` at build time. The deployed Content Security Policy permits browser connections to that exact origin for Auth; production builds fail when the URL is missing.
7. Configure a custom SMTP provider before opening account registration to the public. Supabase's default sender is limited to a low project-wide rate (2 emails per hour) and best-effort delivery. This still affects new account confirmation and password recovery, though ordinary password sign-in does not send email. Check Auth logs for delivery errors before diagnosing the callback or case APIs.

## Recovery behavior

- Guest work stays on the current device until the user chooses **Add this browser's work**. If a durable guest case exists, the claim transaction moves it into the user's personal workspace; the local snapshot is then saved against the claimed case ID. A failed snapshot save can retry on that same case.
- Signed-in users start new work from Saved cases, which creates a case in their account before opening the assessment. A direct work URL without an active account case returns a signed-in user to Saved cases. Work in an active case is saved after local changes and can be resumed at its last valid stage.
- Each account case has its own server snapshot with a revision. A stale revision returns a conflict and does not overwrite another device's edits.
- Opening another case or starting a new one waits for a successful save of the active case. Unsaved guest work blocks switching until it is added to the account.
- Signing out clears cached account case data on this device after saving. Server records remain. A guest draft that has not been added stays in browser storage.
- The case snapshot contains local assessment and derived stage records. Evidence documents, Copilot history, reports, and consultation records remain in their existing case-scoped server tables. The snapshot's durable IDs reconnect those records after restore.
- Claiming a guest case transfers related evidence, chat sessions, reports, leads, and safely attributable consultant notes in the same transaction. The migration leaves historical null-owner consultant notes from additional previously claimed assessments unchanged when their guest provenance cannot be proven from a stored key. Copilot confirmation actor IDs remain historical audit fields; access is controlled through the claimed chat session.
