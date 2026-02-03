
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='counter_edits' AND column_name='edited_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='counter_edits' AND column_name='created_by'
  ) THEN
    ALTER TABLE counter_edits RENAME COLUMN edited_by TO created_by;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='counter_edits' AND column_name='edited_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='counter_edits' AND column_name='created_at'
  ) THEN
    ALTER TABLE counter_edits RENAME COLUMN edited_at TO created_at;
  END IF;
END $$;


DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proposal_status') THEN
    CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;


ALTER TABLE counter_edits
  ADD COLUMN IF NOT EXISTS status proposal_status NOT NULL DEFAULT 'pending';

ALTER TABLE counter_edits
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE counter_edits
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

ALTER TABLE counter_edits
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='counter_edits' AND column_name='is_approved'
  ) THEN
    UPDATE counter_edits SET status = 'approved' WHERE is_approved = TRUE;
    UPDATE counter_edits SET status = 'pending'  WHERE is_approved = FALSE;
    ALTER TABLE counter_edits DROP COLUMN is_approved;
  END IF;
END $$;

-- 5) exercises: add columns safely
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS status proposal_status NOT NULL DEFAULT 'pending';

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;


DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='exercises' AND column_name='is_approved'
  ) THEN
    UPDATE exercises SET status = 'approved' WHERE is_approved = TRUE;
    UPDATE exercises SET status = 'pending'  WHERE is_approved = FALSE;
    ALTER TABLE exercises DROP COLUMN is_approved;
  END IF;
END $$;


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


