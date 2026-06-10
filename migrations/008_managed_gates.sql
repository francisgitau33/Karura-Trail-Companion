create table if not exists managed_gates (
  id uuid primary key default gen_random_uuid(),
  stable_id text not null unique,
  name text not null,
  short_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  access text,
  description text,
  visitor_note text,
  status text not null default 'active',
  confidence text,
  source text not null,
  source_suggestion_id uuid null references place_suggestions(id) on delete set null,
  created_by uuid null references admin_users(id),
  updated_by uuid null references admin_users(id),
  archived_by uuid null references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  restored_at timestamptz null,
  constraint managed_gates_status_check check (status in ('active', 'archived')),
  constraint managed_gates_source_check check (source in ('migration', 'admin', 'public_suggestion')),
  constraint managed_gates_latitude_check check (latitude between -90 and 90),
  constraint managed_gates_longitude_check check (longitude between -180 and 180)
);

create index if not exists managed_gates_active_idx
on managed_gates (updated_at desc)
where status = 'active';

create index if not exists managed_gates_source_suggestion_id_idx
on managed_gates (source_suggestion_id);

create index if not exists managed_gates_short_name_idx
on managed_gates (short_name);

create index if not exists managed_gates_coordinates_idx
on managed_gates (latitude, longitude);
