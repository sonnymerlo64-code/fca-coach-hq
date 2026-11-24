-- FCA Coach HQ voice evaluations. Additive migration.
create table if not exists public.pd_voice_evaluations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null default auth.uid() references auth.users(id),
  player_id uuid not null references public.pd_players(id),
  org text not null default 'fca-baseball' check (org = 'fca-baseball'),
  transcript text not null default '',
  report text not null default '',
  parent_email text not null default '',
  status text not null default 'draft' check (status in ('draft','pending','returned','approved','sent')),
  created_at timestamptz not null default now()
);

create index if not exists pd_voice_eval_coach_idx
  on public.pd_voice_evaluations (coach_id, created_at desc);
create index if not exists pd_voice_eval_status_idx
  on public.pd_voice_evaluations (status, created_at desc);

alter table public.pd_voice_evaluations enable row level security;
grant select, insert, update on public.pd_voice_evaluations to authenticated;

create policy "voice_evaluations_read_own_or_admin"
  on public.pd_voice_evaluations
  for select to authenticated
  using (
    org = 'fca-baseball'
    and (
      coach_id = (select auth.uid())
      or exists (
        select 1 from public.pd_eval_admins a
        where a.org = 'fca-baseball'
          and lower(a.email) = lower((select auth.jwt()->>'email'))
      )
    )
  );

create policy "voice_evaluations_create_draft"
  on public.pd_voice_evaluations
  for insert to authenticated
  with check (
    org = 'fca-baseball'
    and coach_id = (select auth.uid())
    and status = 'draft'
    and exists (
      select 1 from public.pd_players p
      where p.id = player_id and p.org = 'fca-baseball'
    )
  );

create policy "voice_evaluations_edit_own_draft"
  on public.pd_voice_evaluations
  for update to authenticated
  using (
    org = 'fca-baseball'
    and coach_id = (select auth.uid())
    and status in ('draft','returned')
  )
  with check (
    org = 'fca-baseball'
    and coach_id = (select auth.uid())
    and status in ('draft','pending')
  );

create policy "voice_evaluations_admin_edit"
  on public.pd_voice_evaluations
  for update to authenticated
  using (
    org = 'fca-baseball'
    and exists (
      select 1 from public.pd_eval_admins a
      where a.org = 'fca-baseball'
        and lower(a.email) = lower((select auth.jwt()->>'email'))
    )
  )
  with check (
    org = 'fca-baseball'
    and exists (
      select 1 from public.pd_eval_admins a
      where a.org = 'fca-baseball'
        and lower(a.email) = lower((select auth.jwt()->>'email'))
    )
  );
