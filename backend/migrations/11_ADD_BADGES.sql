DO $$
DECLARE
BEGIN
    INSERT INTO badges (code, name, description) VALUES
    ('FIRST_BLOOD', 'First Blood', 'Completed your first exercise correctly.'),
    ('CENTURION', 'Centurion', 'Answered 100 exercises correctly.'),
    ('ACCURACY_MASTER', 'Accuracy Master', 'Get 10 "Easy" ratings in a row.'),
    ('COUNTER_COLLECTOR', 'Counter Collector', 'Practiced 5 different counters.'),
    ('WEEKLY_TOP_10', 'Elite Competitor', 'Finished in the top 10 of the weekly leaderboard.')
    ON CONFLICT (code) DO NOTHING;
END $$;
