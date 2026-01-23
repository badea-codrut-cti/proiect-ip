CREATE TABLE profile_pictures (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profile_pictures (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_picture_id TEXT NOT NULL REFERENCES profile_pictures(id) ON DELETE CASCADE,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, profile_picture_id)
);

ALTER TABLE users ADD COLUMN current_profile_picture_id TEXT REFERENCES profile_pictures(id);
ALTER TABLE users ADD COLUMN gems INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX idx_user_profile_pictures_user ON user_profile_pictures(user_id);
CREATE INDEX idx_user_profile_pictures_picture ON user_profile_pictures(profile_picture_id);
CREATE INDEX idx_users_current_pfp ON users(current_profile_picture_id);

INSERT INTO profile_pictures (name, description, cost) VALUES
    ('default', 'Default profile picture', 0),
    ('cool_cat', 'A cool cat avatar', 100),
    ('space_explorer', 'Explore the cosmos', 250),
    ('ninja_warrior', 'Stealth and precision', 500),
    ('golden_crown', 'Royal treatment', 1000);
