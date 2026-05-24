ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS enable_public_trail_recording BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS show_approved_trails BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS trail_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'public_gps' CHECK (source IN ('admin', 'public_gps')),
  type TEXT NOT NULL CHECK (type IN ('walk_jog', 'cycling', 'family_walk')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  path_geojson JSONB NOT NULL,
  distance_meters DOUBLE PRECISION,
  duration_seconds INTEGER,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS trail_suggestions_status_created_at_idx
ON trail_suggestions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS trail_suggestions_type_status_idx
ON trail_suggestions (type, status);

CREATE INDEX IF NOT EXISTS trail_suggestions_source_status_idx
ON trail_suggestions (source, status);
