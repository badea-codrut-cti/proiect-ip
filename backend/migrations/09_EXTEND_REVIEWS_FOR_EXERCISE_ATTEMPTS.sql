ALTER TABLE reviews
    ADD COLUMN exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
    ADD COLUMN generated_number DOUBLE PRECISION,
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN completed_at TIMESTAMP,
    ADD COLUMN submitted_answer TEXT;

ALTER TABLE reviews
  ALTER COLUMN rating DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL;

ALTER TABLE reviews
  DROP review_duration_ms;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_completion_requires_rating_state
  CHECK (
    (completed_at IS NULL AND rating IS NULL AND state IS NULL)
    OR
    (completed_at IS NOT NULL AND rating IS NOT NULL AND state IS NOT NULL)
  );

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_check,
  ADD CONSTRAINT reviews_rating_check
  CHECK (rating IS NULL OR (rating >= 1 AND rating <= 4));

ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_state_check,
  ADD CONSTRAINT reviews_state_check
  CHECK (state IS NULL OR (state >= 0 AND state <= 3));
