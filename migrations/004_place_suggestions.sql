alter table site_settings
add column if not exists enable_place_suggestions boolean not null default false;

create table if not exists place_suggestions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('landmark', 'facility')),
  name text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'merged')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz
);

create index if not exists place_suggestions_status_created_at_idx
on place_suggestions (status, created_at desc);

create index if not exists place_suggestions_type_status_idx
on place_suggestions (type, status);
