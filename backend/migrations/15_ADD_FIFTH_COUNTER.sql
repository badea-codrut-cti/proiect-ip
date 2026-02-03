-- Add 5th counter (個) for counting small objects
DO $$
DECLARE
    counter_ko_id TEXT := gen_random_uuid();
BEGIN
    INSERT INTO counters (id, name, documentation) 
    VALUES (counter_ko_id, '個', 'Used for counting small objects (apples, boxes, bags, etc.).');

    INSERT INTO exercises (id, counter_id, sentence, translation, min_count, max_count, status) VALUES
        (gen_random_uuid(), counter_ko_id, 'りんごを<ans>買いました。', 'I bought <ans> apple(s).', 1, 10, 'approved'),
        (gen_random_uuid(), counter_ko_id, '箱が<ans>あります。', 'There are <ans> box(es).', 1, 20, 'approved'),
        (gen_random_uuid(), counter_ko_id, 'お菓子を<ans>ください。', 'Please give me <ans> candy/candies.', 1, 12, 'approved');
END $$;
