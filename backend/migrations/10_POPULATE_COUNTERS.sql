DO $$
DECLARE
    counter_age_id TEXT := gen_random_uuid();
    counter_hon_id TEXT := gen_random_uuid();
    counter_mai_id TEXT := gen_random_uuid();
    counter_hiki_id TEXT := gen_random_uuid();
BEGIN
    INSERT INTO counters (id, name, documentation) 
    VALUES (counter_age_id, '歳', 'Used for counting years of age.');

    INSERT INTO exercises (id, counter_id, sentence, min_count, max_count, is_approved) VALUES
        (gen_random_uuid(), counter_age_id, '私は<ans>です。', 1, 100, TRUE),
        (gen_random_uuid(), counter_age_id, '弟は<ans>です。', 1, 20, TRUE),
        (gen_random_uuid(), counter_age_id, '彼は昨日<ans>になりました。', 10, 30, TRUE);

    INSERT INTO counters (id, name, documentation) 
    VALUES (counter_hon_id, '本', 'Used for long, cylindrical objects (bottles, pencils, trees).');

    INSERT INTO exercises (id, counter_id, sentence, min_count, max_count, is_approved) VALUES
        (gen_random_uuid(), counter_hon_id, '水を<ans>買いました。', 1, 10, TRUE),
        (gen_random_uuid(), counter_hon_id, '机の上に鉛筆が<ans>あります。', 1, 12, TRUE),
        (gen_random_uuid(), counter_hon_id, '焼き鳥を<ans>ください。', 1, 5, TRUE);

    INSERT INTO counters (id, name, documentation) 
    VALUES (counter_mai_id, '枚', 'Used for flat objects (paper, shirts, plates).');

    INSERT INTO exercises (id, counter_id, sentence, min_count, max_count, is_approved) VALUES
        (gen_random_uuid(), counter_mai_id, '紙が<ans>必要です。', 1, 50, TRUE),
        (gen_random_uuid(), counter_mai_id, '彼はピザを<ans>食べました。', 1, 8, TRUE),
        (gen_random_uuid(), counter_mai_id, 'コンサートのチケットを<ans>買いました。', 1, 6, TRUE);

    INSERT INTO counters (id, name, documentation) 
    VALUES (counter_hiki_id, '匹', 'Used for small animals (cats, dogs, fish).');

    INSERT INTO exercises (id, counter_id, sentence, min_count, max_count, is_approved) VALUES
        (gen_random_uuid(), counter_hiki_id, '私は猫を<ans>飼っています。', 1, 3, TRUE),
        (gen_random_uuid(), counter_hiki_id, '水槽に魚が<ans>います。', 1, 20, TRUE),
        (gen_random_uuid(), counter_hiki_id, '彼は公園で虫を<ans>捕まえました。', 1, 10, TRUE);

END $$;
