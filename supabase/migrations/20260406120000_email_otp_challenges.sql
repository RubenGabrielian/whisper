-- Run once: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Required for email OTP sign-in (Resend). API uses SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.email_otp_challenges (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null
);

create index if not exists email_otp_challenges_expires_at_idx
  on public.email_otp_challenges (expires_at);

alter table public.email_otp_challenges enable row level security;

-- API routes use the service_role key; it bypasses RLS. Optional explicit grant:
grant all on table public.email_otp_challenges to service_role;

-- No SELECT/INSERT policies for anon/authenticated — only server (service role) touches this table.

comment on table public.email_otp_challenges is 'Email OTP challenges for Resend sign-in; rows deleted after verify.';
