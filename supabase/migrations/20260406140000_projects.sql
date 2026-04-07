-- Dashboard projects (Whisper SDK sites). Access only via Next.js API + service role.
-- Run in Supabase SQL Editor if not using CLI migrations.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  name text not null,
  website_url text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  api_key text not null,
  capture_console boolean not null default true,
  capture_network boolean not null default true,
  session_timeline_seconds int not null default 30 check (session_timeline_seconds in (10, 30, 60)),
  widget_dark_mode boolean not null default false,
  created_at timestamptz not null default now(),
  constraint projects_api_key_unique unique (api_key)
);

create index if not exists projects_owner_email_created_at_idx
  on public.projects (owner_email, created_at desc);

alter table public.projects enable row level security;

grant select, insert, update, delete on table public.projects to service_role;

comment on table public.projects is 'User projects for Whisper widget; rows scoped by owner_email via API.';
