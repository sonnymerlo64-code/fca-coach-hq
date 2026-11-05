# FCA Coach HQ — Phase 3 Integration Candidate

This is a **test build**, not a verified production release. It packages the latest uploaded evaluation, lineup, and practice planner source.

## Included
- Central Supabase login on the dashboard and application pages; existing session passed to the two embedded legacy tools using a same-origin message. No second email/password prompt.
- Lineup Manager now reads the configured Supabase project URL and publishable key rather than a hardcoded project, and uses the central session for shared workspace calls.
- Evaluation uses 1–5 ratings for **new** evaluations, defaults to Level 1, and checks >=80% separately for Offense, Defense, Character. Historical unmarked evaluations are interpreted as 1–8 and editing is blocked to avoid corrupting their scores.
- Practice Planner remains a separate code module with its existing local persistence.

## Deploy cautiously
1. Keep existing three apps online. Back up your Lineup Manager JSON and Supabase project.
2. Upload the CONTENTS of this ZIP to the fca-coach-hq GitHub repository; Vercel should build as Next.js.
3. In Vercel set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (public key ONLY) for the same FCA project, then redeploy.
4. Test login, navigation, roster cloud load, saved evaluations, practice planner, logout and a second coach account on a temporary preview deployment before changing production domain.
5. To approve certifications at 80%, **review and run** `migration-hq-certification-80.sql` in existing FCA Supabase after backup; never rerun old schema migrations.

## Remaining limitations — do not claim these are complete
- **Shared cross-tool roster** is not implemented: Lineup Manager still stores a JSON workspace, Player Evaluation stores relational `pd_players`, and Practice Planner does not use a shared roster.
- Static HTML files under `/public` can be requested directly. The client-side login gate is NOT a server-side access control boundary. Production requires authenticated server-side route protection and reviewed Supabase RLS.
- The legacy lineup JSON workspace is last-write-wins; simultaneous coaches can overwrite changes. Export backups and avoid simultaneous editing.
- Practice plans are still saved locally, not in Supabase.
- Legacy evaluations do not have a scale marker, so they are treated as 1–8; verify this assumption against existing records.
- Category score logic and certification migration have not been validated against live Supabase.
- No live deployment tests performed here. GRIND and Game MGR are excluded.


## Build-error fix (2026-11-05)
The /evaluations and /lineups page components are now client components, so their AuthGate render-function children do not cross a server/client serialization boundary. This targets the Vercel error `Functions cannot be passed directly to Client Components`. Rebuild on Vercel; full production build could not be run in this environment.
