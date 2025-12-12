CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE contributor_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    jlpt_level INTEGER CHECK (jlpt_level >= 1 AND jlpt_level <= 5),
    status application_status NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMP
);

CREATE UNIQUE INDEX idx_unique_pending_application ON contributor_applications(user_id) WHERE status = 'pending';

CREATE INDEX idx_contributor_applications_user_id ON contributor_applications(user_id);
CREATE INDEX idx_contributor_applications_status ON contributor_applications(status);
CREATE INDEX idx_contributor_applications_approved_by ON contributor_applications(approved_by);
CREATE INDEX idx_contributor_applications_applied_at ON contributor_applications(applied_at);