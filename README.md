# FCA Coach HQ — Phase 2 Integration Preview

## Included
- One Supabase email/password login on the dashboard; original Player Evaluation shares the same Supabase auth session.
- Lineup Manager receives the logged-in session from the dashboard, with no second login prompt.
- Practice Planner is behind the same login but **still stores plans locally in the browser**.
- Player Evaluation new scoring 1–5, Level 1 default, 80% in each of Offense, Defense, Character for certification. Existing evaluations remain in the original 1–8 scale.
- Original applications remain independent modules. GRIND and Game MGR are excluded.

## Deploy
Upload all files in this ZIP to the existing `fca-coach-hq` GitHub repository, replacing the Phase 1 files. Keep the original three app deployments unchanged. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel and redeploy. Use only the publishable/anon key.

## Important before certification approvals
Run `migration-hq-certification-80.sql` in the existing Supabase SQL editor AFTER backing up, because the previous schema requires scores >=90. Do not rerun older migrations.

## Still pending (not represented as complete)
- True cross-tool synchronized team rosters and grade/age management; lineup still uses its separate JSON workspace.
- Practice-plan cloud synchronization.
- Central administrator UI and stronger role-based RLS policies.
- Historical 1–8 evaluation score trend normalization and comprehensive print-report QA.
- Full browser and live Vercel/Supabase testing.

This is a test build, not a verified production migration.
