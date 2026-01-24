DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'exercise_approval', 
        'exercise_rejection', 
        'counter_edit_approval', 
        'counter_edit_rejection', 
        'announcement', 
        'feedback',
        'badge_earned',
        'contributor_application_approval',
        'contributor_application_rejection'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
    counter_edit_id TEXT REFERENCES counter_edits(id) ON DELETE SET NULL,
    announcement_id TEXT REFERENCES announcements(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES badges(id) ON DELETE CASCADE,
    contributor_application_id TEXT REFERENCES contributor_applications(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_notification_refs CHECK (
        (type IN ('exercise_approval', 'exercise_rejection') AND exercise_id IS NOT NULL) OR
        (type IN ('counter_edit_approval', 'counter_edit_rejection') AND counter_edit_id IS NOT NULL) OR
        (type = 'announcement' AND announcement_id IS NOT NULL) OR
        (type = 'badge_earned' AND badge_id IS NOT NULL) OR
        (type IN ('contributor_application_approval', 'contributor_application_rejection') AND contributor_application_id IS NOT NULL) OR
        (type = 'feedback')
    )
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
