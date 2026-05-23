ALTER TABLE place_suggestions
DROP CONSTRAINT IF EXISTS place_suggestions_status_check;

ALTER TABLE place_suggestions
ADD CONSTRAINT place_suggestions_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'merged', 'archived'));

ALTER TABLE place_suggestions
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
