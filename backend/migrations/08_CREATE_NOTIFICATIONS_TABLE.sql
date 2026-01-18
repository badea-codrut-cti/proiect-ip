DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'exercise_approval', 
        'exercise_rejection', 
        'counter_edit_approval', 
        'counter_edit_rejection', 
        'announcement', 
        'feedback'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    counter_edit_id UUID REFERENCES counter_edits(id) ON DELETE SET NULL,
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_notification_refs CHECK (
        (type IN ('exercise_approval', 'exercise_rejection') AND exercise_id IS NOT NULL) OR
        (type IN ('counter_edit_approval', 'counter_edit_rejection') AND counter_edit_id IS NOT NULL) OR
        (type = 'announcement' AND announcement_id IS NOT NULL) OR
        (type = 'feedback')
    )
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
