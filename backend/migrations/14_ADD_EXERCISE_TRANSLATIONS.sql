-- Add translation column to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS translation TEXT;

-- Update existing exercises with translations
UPDATE exercises 
SET translation = 'I am <ans> years old.'
WHERE sentence = '私は<ans>です。';

UPDATE exercises 
SET translation = 'My younger brother is <ans> years old.'
WHERE sentence = '弟は<ans>です。';

UPDATE exercises 
SET translation = 'He turned <ans> years old yesterday.'
WHERE sentence = '彼は昨日<ans>になりました。';

UPDATE exercises 
SET translation = 'I bought <ans> bottle(s) of water.'
WHERE sentence = '水を<ans>買いました。';

UPDATE exercises 
SET translation = 'There are <ans> pencil(s) on the desk.'
WHERE sentence = '机の上に鉛筆が<ans>あります。';

UPDATE exercises 
SET translation = 'Please give me <ans> yakitori skewer(s).'
WHERE sentence = '焼き鳥を<ans>ください。';

UPDATE exercises 
SET translation = 'I need <ans> sheet(s) of paper.'
WHERE sentence = '紙が<ans>必要です。';

UPDATE exercises 
SET translation = 'He ate <ans> slice(s) of pizza.'
WHERE sentence = '彼はピザを<ans>食べました。';

UPDATE exercises 
SET translation = 'I bought <ans> concert ticket(s).'
WHERE sentence = 'コンサートのチケットを<ans>買いました。';

UPDATE exercises 
SET translation = 'I have <ans> cat(s).'
WHERE sentence = '私は猫を<ans>飼っています。';

UPDATE exercises 
SET translation = 'There are <ans> fish in the aquarium.'
WHERE sentence = '水槽に魚が<ans>います。';

UPDATE exercises 
SET translation = 'He caught <ans> insect(s) in the park.'
WHERE sentence = '彼は公園で虫を<ans>捕まえました。';
