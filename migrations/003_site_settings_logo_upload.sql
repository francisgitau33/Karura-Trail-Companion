alter table site_settings
add column if not exists official_logo_data text null,
add column if not exists official_logo_mime_type text null,
add column if not exists official_logo_filename text null;
