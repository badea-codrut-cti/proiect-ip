CREATE TABLE IF NOT EXISTS counters (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    documentation TEXT
);

CREATE TABLE IF NOT EXISTS card_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counter_id TEXT NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    stability FLOAT NOT NULL DEFAULT 0 CHECK (stability >= 0),
    difficulty FLOAT NOT NULL DEFAULT 0 CHECK (difficulty >= 0),
    elapsed_days INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_days >= 0),
    scheduled_days INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_days >= 0),
    reps INTEGER NOT NULL DEFAULT 0 CHECK (reps >= 0),
    lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
    state INTEGER NOT NULL DEFAULT 0 CHECK (state >= 0 AND state <= 3),
    last_review TIMESTAMP,
    due TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, counter_id)
);

CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    counter_id TEXT NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    min_count FLOAT NOT NULL DEFAULT 1 CHECK (min_count >= 0),
    max_count FLOAT NOT NULL DEFAULT 10 CHECK (max_count >= 0),
    decimal_points INTEGER DEFAULT 0 CHECK (decimal_points >= 0),
    is_approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS counter_edits (
    id TEXT PRIMARY KEY,
    edited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    counter_id TEXT NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counter_id TEXT NOT NULL REFERENCES counters(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 4),
    state INTEGER NOT NULL CHECK (state >= 0 AND state <= 3),
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_days INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_days >= 0),
    elapsed_days INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_days >= 0),
    review_duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (review_duration_ms >= 0)
);

CREATE INDEX idx_card_state_user_id ON card_state(user_id);
CREATE INDEX idx_card_state_counter_id ON card_state(counter_id);
CREATE INDEX idx_card_state_due ON card_state(due);
CREATE INDEX idx_card_state_user_counter ON card_state(user_id, counter_id);

CREATE INDEX idx_exercises_counter_id ON exercises(counter_id);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
CREATE INDEX idx_exercises_is_approved ON exercises(is_approved);

CREATE INDEX idx_counter_edits_counter_id ON counter_edits(counter_id);
CREATE INDEX idx_counter_edits_edited_by ON counter_edits(edited_by);
CREATE INDEX idx_counter_edits_is_approved ON counter_edits(is_approved);

CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_counter_id ON reviews(counter_id);
CREATE INDEX idx_reviews_reviewed_at ON reviews(reviewed_at);
CREATE INDEX idx_reviews_user_counter ON reviews(user_id, counter_id);
