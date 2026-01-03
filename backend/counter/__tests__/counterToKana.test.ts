import { counterToKana } from '../index.js';

describe('counterToKana - universal function', () => {
  describe('Age counter', () => {
    test('handles age with 歳 (standard age counter)', () => {
      expect(counterToKana('歳', 1)).toBe('いちさい');
      expect(counterToKana('歳', 10)).toBe('じゅうさい');
      expect(counterToKana('歳', 20)).toBe('はたち');
      expect(counterToKana('歳', 25)).toBe('にじゅうごさい');
      expect(counterToKana('歳', 100)).toBe('ひゃくさい');
    });

    test('handles age with 才 (alternative age counter)', () => {
      expect(counterToKana('才', 1)).toBe('いちさい');
      expect(counterToKana('才', 10)).toBe('じゅうさい');
      expect(counterToKana('才', 20)).toBe('はたち');
      expect(counterToKana('才', 25)).toBe('にじゅうごさい');
      expect(counterToKana('才', 100)).toBe('ひゃくさい');
    });

    test('handles string number inputs for age', () => {
      expect(counterToKana('歳', '5')).toBe('ごさい');
      expect(counterToKana('才', '15')).toBe('じゅうごさい');
      expect(counterToKana('歳', '50')).toBe('ごじゅうさい');
    });

    test('throws error for decimal age', () => {
      expect(() => counterToKana('歳', 5.5)).toThrow('Age must not have decimals');
      expect(() => counterToKana('才', '10.5')).toThrow('Age must not have decimals');
    });
  });

  describe('Date counter', () => {
    test('handles days with 日 counter', () => {
      expect(counterToKana('日', 1)).toBe('ついたち');
      expect(counterToKana('日', 2)).toBe('ふつか');
      expect(counterToKana('日', 3)).toBe('みっか');
      expect(counterToKana('日', 4)).toBe('よっか');
      expect(counterToKana('日', 5)).toBe('いつか');
      expect(counterToKana('日', 6)).toBe('むいか');
      expect(counterToKana('日', 7)).toBe('なのか');
      expect(counterToKana('日', 8)).toBe('ようか');
      expect(counterToKana('日', 9)).toBe('ここのか');
      expect(counterToKana('日', 10)).toBe('とおか');
    });

    test('handles special non-standard date readings', () => {
      expect(counterToKana('日', 14)).toBe('じゅうよっか');
      expect(counterToKana('日', 20)).toBe('はつか');
      expect(counterToKana('日', 24)).toBe('にじゅうよっか');
    });

    test('handles standard date readings for other days', () => {
      expect(counterToKana('日', 11)).toBe('じゅういちにち');
      expect(counterToKana('日', 15)).toBe('じゅうごにち');
      expect(counterToKana('日', 21)).toBe('にじゅういちにち');
      expect(counterToKana('日', 25)).toBe('にじゅうごにち');
      expect(counterToKana('日', 30)).toBe('さんじゅうにち');
      expect(counterToKana('日', 31)).toBe('さんじゅういちにち');
    });

    test('handles large day numbers (not just days of month)', () => {
      expect(counterToKana('日', 34)).toBe('さんじゅうよんにち');
      expect(counterToKana('日', 45)).toBe('よんじゅうごにち');
      expect(counterToKana('日', 100)).toBe('ひゃくにち');
      expect(counterToKana('日', 365)).toBe('さんびゃくろくじゅうごにち');
    });

    test('handles string number inputs for days', () => {
      expect(counterToKana('日', '1')).toBe('ついたち');
      expect(counterToKana('日', '20')).toBe('はつか');
      expect(counterToKana('日', '100')).toBe('ひゃくにち');
    });

    test('throws error for decimal days', () => {
      expect(() => counterToKana('日', 5.5)).toThrow('Day must not have decimals');
      expect(() => counterToKana('日', '10.5')).toThrow('Day must not have decimals');
    });

    test('throws error for non-positive days', () => {
      expect(() => counterToKana('日', 0)).toThrow('Day must be positive');
      expect(() => counterToKana('日', -5)).toThrow('Day must be positive');
    });
  });

  describe('Digit-ending counters', () => {
    test('handles 本 counter based on last digit', () => {
      expect(counterToKana('本', 1)).toBe('いっぽん');
      expect(counterToKana('本', 2)).toBe('にほん');
      expect(counterToKana('本', 3)).toBe('さんぼん');
      expect(counterToKana('本', 6)).toBe('ろっぽん');
      expect(counterToKana('本', 10)).toBe('じゅっぽん');
      expect(counterToKana('本', 11)).toBe('じゅういっぽん');
      expect(counterToKana('本', 20)).toBe('にじゅっぽん');
      expect(counterToKana('本', 21)).toBe('にじゅういっぽん');
          expect(counterToKana('本', 100)).toBe('ひゃっぽん');
    });

    test('handles 匹 counter based on last digit', () => {
      expect(counterToKana('匹', 1)).toBe('いっぴき');
      expect(counterToKana('匹', 3)).toBe('さんびき');
      expect(counterToKana('匹', 6)).toBe('ろっぴき');
      expect(counterToKana('匹', 10)).toBe('じゅっぴき');
      expect(counterToKana('匹', 13)).toBe('じゅうさんびき');
          expect(counterToKana('匹', 100)).toBe('ひゃっぴき');
    });

    test('handles 個 counter based on last digit', () => {
      expect(counterToKana('個', 1)).toBe('いっこ');
      expect(counterToKana('個', 6)).toBe('ろっこ');
      expect(counterToKana('個', 10)).toBe('じゅっこ');
      expect(counterToKana('個', 15)).toBe('じゅうごこ');
          expect(counterToKana('個', 100)).toBe('ひゃっこ');
    });

    test('handles 杯 counter based on last digit', () => {
      expect(counterToKana('杯', 1)).toBe('いっぱい');
      expect(counterToKana('杯', 3)).toBe('さんばい');
      expect(counterToKana('杯', 8)).toBe('はっぱい');
      expect(counterToKana('杯', 10)).toBe('じゅっぱい');
          expect(counterToKana('杯', 100)).toBe('ひゃっぱい');
    });

    test('handles 冊 counter based on last digit', () => {
      expect(counterToKana('冊', 1)).toBe('いっさつ');
      expect(counterToKana('冊', 6)).toBe('ろくさつ');
      expect(counterToKana('冊', 10)).toBe('じゅうっさつ');
      expect(counterToKana('冊', 100)).toBe('ひゃくさつ');
    });

    test('handles 枚 counter (regular counter, no special readings)', () => {
      expect(counterToKana('枚', 1)).toBe('いちまい');
      expect(counterToKana('枚', 2)).toBe('にまい');
      expect(counterToKana('枚', 10)).toBe('じゅうまい');
      expect(counterToKana('枚', 15)).toBe('じゅうごまい');
          expect(counterToKana('枚', 100)).toBe('ひゃくまい');
    });

    test('handles 回 counter with special readings', () => {
      expect(counterToKana('回', 1)).toBe('いっかい');
      expect(counterToKana('回', 6)).toBe('ろっかい');
      expect(counterToKana('回', 10)).toBe('じゅうっかい');
      expect(counterToKana('回', 100)).toBe('ひゃっかい');
    });

    test('handles 分 counter for minutes', () => {
      expect(counterToKana('分', 1)).toBe('いっぷん');
      expect(counterToKana('分', 3)).toBe('さんぷん');
      expect(counterToKana('分', 10)).toBe('じゅうっぷん');
      expect(counterToKana('分', 15)).toBe('じゅうごふん');
          expect(counterToKana('分', 100)).toBe('ひゃくっぷん');
    });

    test('handles 年 counter for years', () => {
      expect(counterToKana('年', 1)).toBe('いちねん');
      expect(counterToKana('年', 4)).toBe('よねん');
      expect(counterToKana('年', 10)).toBe('じゅうねん');
      expect(counterToKana('年', 20)).toBe('にじゅうねん');
          expect(counterToKana('年', 100)).toBe('ひゃくねん');
    });

    test('handles 円 counter for yen', () => {
      expect(counterToKana('円', 1)).toBe('いちえん');
      expect(counterToKana('円', 10)).toBe('じゅうえん');
      expect(counterToKana('円', 100)).toBe('ひゃくえん');
      expect(counterToKana('円', 1000)).toBe('せんえん');
    });

    test('handles 時間 counter for hours', () => {
      expect(counterToKana('時間', 1)).toBe('いちじかん');
      expect(counterToKana('時間', 4)).toBe('よじかん');
      expect(counterToKana('時間', 7)).toBe('ななじかん');
      expect(counterToKana('時間', 10)).toBe('じゅうじかん');
    });

    test('handles string number inputs for digit-ending counters', () => {
      expect(counterToKana('本', '1')).toBe('いっぽん');
      expect(counterToKana('本', '11')).toBe('じゅういっぽん');
      expect(counterToKana('匹', '3')).toBe('さんびき');
      expect(counterToKana('匹', '13')).toBe('じゅうさんびき');
    });

    test('throws error for decimal numbers with digit-ending counters', () => {
      expect(() => counterToKana('本', 5.5)).toThrow('do not support decimals');
      expect(() => counterToKana('匹', '10.5')).toThrow('do not support decimals');
    });

    test('throws error for negative numbers with digit-ending counters', () => {
      expect(() => counterToKana('本', -1)).toThrow('non-negative');
      expect(() => counterToKana('個', '-5')).toThrow('non-negative');
    });
  });

  describe('Error handling', () => {
    test('throws error for unsupported counters', () => {
      expect(() => counterToKana('人', 2)).toThrow('Counter "人" is not supported');
    });
  });
});

