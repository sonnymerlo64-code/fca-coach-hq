-- Voice evaluation drafts. Run in Supabase SQL editor before preview testing.
create table if not exists public.pd_voice_evaluations (
 id uuid primary key default gen_random_uuid(), coach_id uuid not null default auth.uid(), player_id text not null,
 org text not null default 'fca-baseball', transcript text not null, report text not null,
 parent_email text not null default '', status text not null default 'draft' check(status in ('draft','pending','returned','approved','sent')),
 created_at timestamptz not null default now()
);
alter table public.pd_voice_evaluations enable row level security;
create or replace function public.pd_voice_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.pd_eval_admins where org='fca-baseball' and lower(email)=lower(auth.jwt()->>'email')) $$;
create policy voice_read on public.pd_voice_evaluations for select to authenticated using (org='fca-baseball' and (coach_id=auth.uid() or public.pd_voice_admin()));
create policy voice_insert on public.pd_voice_evaluations for insert to authenticated with check (org='fca-baseball' and coach_id=auth.uid() and status='draft');
create policy voice_edit on public.pd_voice_evaluations for update to authenticated using (org='fca-baseball' and (public.pd_voice_admin() or (coach_id=auth.uid() and status in ('draft','returned')))) with check (org='fca-baseball' and (public.pd_voice_admin() or (coach_id=auth.uid() and status in ('draft','pending'))));
