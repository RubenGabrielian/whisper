-- Extended project configuration (appearance, collection, notifications).
-- Apply after 20260406140000_projects.sql

alter table public.projects
  add column if not exists widget_theme text not null default 'system'
    constraint projects_widget_theme_check check (widget_theme in ('light', 'dark', 'system'));

alter table public.projects
  add column if not exists accent_color text not null default '#06b6d4';

alter table public.projects
  add column if not exists widget_position text not null default 'bottom-right'
    constraint projects_widget_position_check check (widget_position in ('bottom-right', 'bottom-left'));

alter table public.projects
  add column if not exists widget_label text not null default 'Send Feedback';

alter table public.projects
  add column if not exists capture_network_failures_only boolean not null default true;

alter table public.projects
  add column if not exists session_timeline_enabled boolean not null default true;

alter table public.projects
  add column if not exists capture_device_metadata boolean not null default true;

alter table public.projects
  add column if not exists alert_email text not null default '';

alter table public.projects
  add column if not exists slack_webhook_url text not null default '';

alter table public.projects
  add column if not exists discord_webhook_url text not null default '';

-- Backfill from legacy columns where rows existed before this migration
update public.projects
set
  widget_theme = case when widget_dark_mode then 'dark' else 'light' end,
  capture_network_failures_only = capture_network
where true;

comment on column public.projects.widget_theme is 'Widget UI theme: light | dark | system';
comment on column public.projects.accent_color is 'Primary accent hex color for the widget';
comment on column public.projects.capture_network_failures_only is 'When true, only failed HTTP requests (4xx/5xx) are captured';
