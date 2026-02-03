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
