ALTER TABLE counter_edits RENAME COLUMN edited_by TO created_by;
ALTER TABLE counter_edits RENAME COLUMN edited_at TO created_at;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
        CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

ALTER TABLE counter_edits ADD COLUMN status proposal_status NOT NULL DEFAULT 'pending';
ALTER TABLE counter_edits ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE counter_edits SET status = 'approved' WHERE is_approved = true;
UPDATE counter_edits SET status = 'pending' WHERE is_approved = false;

ALTER TABLE counter_edits DROP COLUMN is_approved;

ALTER TABLE exercises ADD COLUMN status proposal_status NOT NULL DEFAULT 'pending';
ALTER TABLE exercises ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE exercises ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE exercises SET status = 'approved' WHERE is_approved = true;
UPDATE exercises SET status = 'pending' WHERE is_approved = false;

ALTER TABLE exercises DROP COLUMN is_approved;


ALTER TABLE counter_edits
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;


ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;


UPDATE counter_edits
SET reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)
WHERE status = 'approved';

UPDATE exercises
SET reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_counter_edits_status      ON counter_edits(status);
CREATE INDEX IF NOT EXISTS idx_counter_edits_created_at  ON counter_edits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_counter_edits_created_by  ON counter_edits(created_by);

CREATE INDEX IF NOT EXISTS idx_exercises_status          ON exercises(status);
CREATE INDEX IF NOT EXISTS idx_exercises_created_at      ON exercises(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_counter_edits_one_pending
ON counter_edits(counter_id)
WHERE status = 'pending';
