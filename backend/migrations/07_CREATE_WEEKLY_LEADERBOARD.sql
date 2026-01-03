CREATE TABLE IF NOT EXISTS weekly_leaderboard (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, week_start)
);

CREATE INDEX idx_weekly_leaderboard_week_start_points ON weekly_leaderboard(week_start, points DESC);
