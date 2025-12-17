-- 05_MOCK_DATA_INSERTS.sql

INSERT INTO users (
    id, username, email, password_hash, password_salt, 
    is_admin, is_contributor, xp, desired_retention, gems
) VALUES (
    '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 
    'testing', 
    'Testing123@sasa.com', 
    '$2b$10$69/iXvAUI/3WnPHT.1JqBO91euaIPVO.KBEbqp6NFy1KnByR.RRqC', 
    '$2b$10$69/iXvAUI/3WnPHT.1JqBO', 
    FALSE,    FALSE,
    0, 
    0.85, 
    0
) ON CONFLICT (id) DO NOTHING;

INSERT INTO counters (id, name, documentation) VALUES
('counter_vocab_001', 'Japanese Vocabulary: Food', 'A counter for reviewing basic Japanese food vocabulary.'),
('counter_kanji_002', 'JLPT N5 Kanji Practice', 'Kanji characters required for the JLPT N5 exam.'),
('counter_math_003', 'Mental Math: Addition', 'Simple addition practice for mental math.');

-- ******************************************************

INSERT INTO exercises (id, created_by, approved_by, counter_id, sentence, min_count, max_count, decimal_points, is_approved) VALUES ('ex_food_001', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_vocab_001', 'How do you say "sushi" in Japanese?', 1.0, 1.0, 0, TRUE), ('ex_food_002', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_vocab_001', 'What is the word for "water"?', 1.0, 1.0, 0, TRUE);

INSERT INTO exercises (id, created_by, approved_by, counter_id, sentence, min_count, max_count, decimal_points, is_approved) VALUES ('ex_kanji_001', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_kanji_002', 'What is the meaning of the kanji for "person" (人)?', 1.0, 1.0, 0, TRUE), ('ex_kanji_002', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_kanji_002', 'Write the kanji for "three" (三).', 1.0, 1.0, 0, TRUE);




INSERT INTO counter_edits (id, edited_by, counter_id, content, is_approved) VALUES ('edit_001', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_vocab_001', 'Updated documentation to include sushi types.', TRUE), ('edit_002', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_kanji_002', 'Proposed new kanji list for N5 levels.', FALSE);


INSERT INTO card_state (id, user_id, counter_id, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due) VALUES ('state_001', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_vocab_001', 5.2, 3.1, 2, 5, 10, 1, 1, CURRENT_TIMESTAMP + INTERVAL '1 day'), ('state_002', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_kanji_002', 1.5, 6.2, 0, 1, 2, 0, 0, CURRENT_TIMESTAMP);


INSERT INTO reviews (id, user_id, counter_id, rating, state, reviewed_at, scheduled_days, elapsed_days, review_duration_ms) VALUES ('rev_001', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_vocab_001', 3, 1, CURRENT_TIMESTAMP - INTERVAL '2 days', 3, 1, 4500), ('rev_002', '4fa828dd-9462-4425-93b2-c0dde4c1c18c', 'counter_vocab_001', 4, 1, CURRENT_TIMESTAMP - INTERVAL '5 days', 1, 0, 3200);