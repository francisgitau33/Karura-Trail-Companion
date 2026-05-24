ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS about_map_body TEXT,
ADD COLUMN IF NOT EXISTS about_kch_body TEXT,
ADD COLUMN IF NOT EXISTS about_final_comment TEXT;
