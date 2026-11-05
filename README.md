# FCA Coach HQ — Integration Preview (Phase 1)

Contains the uploaded Player Evaluation, Lineup & Rotation Manager, and FCA Practice Planner, accessible from a unified Next.js dashboard.

## Deploy
1. Create a NEW GitHub repository and upload the contents of this folder (not the ZIP itself).
2. Import the repository in Vercel as a Next.js project. Keep your existing apps running.
3. In Vercel Project Settings → Environment Variables, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from your EXISTING non-GRIND Supabase project. Never use a service-role key.
4. Deploy to the temporary `.vercel.app` URL. Test all three modules before connecting FCACoachHQ.com.
5. In Vercel Project Settings → Domains, assign FCACoachHQ.com only after tests pass.

## Status and limitations
- Dashboard and three tool routes are packaged; the uploaded tool code is preserved.
- Player Evaluation uses its original Supabase authentication. The lineup tool has its own sign-in/cloud configuration. The practice planner uses its original storage behavior.
- **Not yet implemented:** single sign-on, grade/age-based shared roster synchronization across all tools, central admin, production-grade permissions and concurrency handling.
- The lineup database is currently a JSON workspace; evaluation has distinct tables. Sharing one Supabase project does NOT automatically sync them.
- Original database RLS policies are broad. Review and tighten permissions before a wider rollout.
- Do NOT rerun existing SQL migrations without reviewing applied migrations and taking a backup.
- GRIND and Game MGR are not included.
