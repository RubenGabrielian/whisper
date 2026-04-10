-- Feedback reports stored for dashboard + summary emails.
-- Inserts use service role (API). Owners read/update via authenticated JWT (email claim) or Next.js API (service role + session check).

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_email text not null,
  user_message text not null,
  user_data jsonb not null default '{}'::jsonb,
  session_timeline jsonb not null default '[]'::jsonb,
  logs jsonb not null default '{"console":[],"network":[]}'::jsonb,
  created_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new', 'resolved', 'archived'))
);

create index if not exists reports_project_id_created_at_idx
  on public.reports (project_id, created_at desc);

create index if not exists reports_owner_email_created_at_idx
  on public.reports (owner_email, created_at desc);

comment on table public.reports is 'Widget feedback payloads; full detail in dashboard. owner_email denormalized for RLS.';

alter table public.reports enable row level security;

-- Service role bypasses RLS (server-side widget + dashboard API).
grant select, insert, update, delete on table public.reports to service_role;

-- Authenticated Supabase users (e.g. Google OAuth) can read/update their rows by email claim.
-- Email-OTP dashboard users use Next.js API routes with service role instead.
grant select, update on table public.reports to authenticated;

create policy reports_select_own on public.reports
  for select
  to authenticated
  using (
    lower(trim(owner_email)) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );

create policy reports_update_own on public.reports
  for update
  to authenticated
  using (
    lower(trim(owner_email)) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  )
  with check (
    lower(trim(owner_email)) = lower(trim(coalesce((select auth.jwt() ->> 'email'), '')))
  );
