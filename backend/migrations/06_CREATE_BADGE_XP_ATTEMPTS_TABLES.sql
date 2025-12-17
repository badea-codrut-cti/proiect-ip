CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS exercise_attempts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
  xp_gained INTEGER NOT NULL CHECK (xp_gained >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ex_attempts_user
  ON exercise_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_ex_attempts_exercise
  ON exercise_attempts(exercise_id);

CREATE INDEX IF NOT EXISTS idx_ex_attempts_created
  ON exercise_attempts(created_at);


INSERT INTO badges (code, name, description) VALUES
  ('FIRST_EXERCISE', 'First Exercise', 'Ai rezolvat primul exercițiu'),
  ('FIRST_CORRECT', 'Correct Answer', 'Primul răspuns corect'),
  ('BECOME_CONTRIBUTOR', 'Contributor', 'Ai devenit contributor')
ON CONFLICT (code) DO NOTHING;


