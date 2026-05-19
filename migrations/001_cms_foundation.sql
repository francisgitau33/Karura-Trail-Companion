create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null default 'PLATFORM_OWNER',
  is_active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  last_login_at timestamp null,
  constraint admin_users_role_check check (role = 'PLATFORM_OWNER')
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  app_name text not null,
  tagline text null,
  prototype_banner_text text null,
  show_prototype_banner boolean not null default true,
  about_title text not null,
  about_body text not null,
  about_call_to_action_text text null,
  donate_title text not null,
  donate_body text not null,
  mpesa_paybill text null,
  mpesa_account_reference text null,
  donation_note text null,
  website_url text null,
  website_button_text text null,
  safety_title text not null,
  safety_body text not null,
  boundary_disclaimer text null,
  visitor_guidance_note text null,
  contact_email text null,
  linkedin_url text null,
  medium_url text null,
  updated_by uuid null references admin_users(id),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references admin_users(id),
  actor_email text null,
  action text not null,
  entity_type text null,
  entity_id text null,
  metadata jsonb null,
  created_at timestamp not null default now()
);

create index if not exists audit_log_created_at_idx on audit_log (created_at desc);
create index if not exists audit_log_actor_user_id_idx on audit_log (actor_user_id);
