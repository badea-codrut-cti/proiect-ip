CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username VARCHAR(31) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    is_contributor BOOLEAN DEFAULT FALSE,
    xp INTEGER DEFAULT 0,
    desired_retention FLOAT DEFAULT 0.85,
    last_optimized_at TIMESTAMP,
    fsrs_params FLOAT[]
);

-- User keys table for authentication
CREATE TABLE IF NOT EXISTS user_key (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    hashed_password TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    active_expires BIGINT NOT NULL,
    idle_expires BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_key_user_id ON user_key(user_id);
CREATE INDEX idx_user_session_user_id ON user_session(user_id);
