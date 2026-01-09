import { numberToKana, normalizeNumberInput, getLastDigitOfInteger } from '../numberToKana.js';

describe('numberToKana', () => {
  describe('Basic numbers (0-9)', () => {
    test('converts 0 to rei', () => {
      expect(numberToKana(0)).toBe('れい');
      expect(numberToKana('0')).toBe('れい');
    });

    test('converts single digits correctly', () => {
      expect(numberToKana(1)).toBe('いち');
      expect(numberToKana(2)).toBe('に');
      expect(numberToKana(3)).toBe('さん');
      expect(numberToKana(4)).toBe('よん');
      expect(numberToKana(5)).toBe('ご');
      expect(numberToKana(6)).toBe('ろく');
      expect(numberToKana(7)).toBe('なな');
      expect(numberToKana(8)).toBe('はち');
      expect(numberToKana(9)).toBe('きゅう');
    });
  });

  describe('Small numbers (10-99)', () => {
    test('converts 10-19 correctly', () => {
      expect(numberToKana(10)).toBe('じゅう');
      expect(numberToKana(11)).toBe('じゅういち');
      expect(numberToKana(12)).toBe('じゅうに');
      expect(numberToKana(13)).toBe('じゅうさん');
      expect(numberToKana(14)).toBe('じゅうよん');
      expect(numberToKana(15)).toBe('じゅうご');
      expect(numberToKana(16)).toBe('じゅうろく');
      expect(numberToKana(17)).toBe('じゅうなな');
      expect(numberToKana(18)).toBe('じゅうはち');
      expect(numberToKana(19)).toBe('じゅうきゅう');
    });

    test('converts tens with special pronunciations', () => {
      expect(numberToKana(20)).toBe('にじゅう');
      expect(numberToKana(30)).toBe('さんじゅう');
      expect(numberToKana(40)).toBe('よんじゅう');
      expect(numberToKana(50)).toBe('ごじゅう');
      expect(numberToKana(60)).toBe('ろくじゅう');
      expect(numberToKana(70)).toBe('ななじゅう');
      expect(numberToKana(80)).toBe('はちじゅう');
      expect(numberToKana(90)).toBe('きゅうじゅう');
    });

    test('converts random two-digit numbers', () => {
      expect(numberToKana(23)).toBe('にじゅうさん');
      expect(numberToKana(45)).toBe('よんじゅうご');
      expect(numberToKana(67)).toBe('ろくじゅうなな');
      expect(numberToKana(89)).toBe('はちじゅうきゅう');
      expect(numberToKana(99)).toBe('きゅうじゅうきゅう');
    });
  });

  describe('Hundreds (100-999)', () => {
    test('converts hundreds with special pronunciations', () => {
      expect(numberToKana(100)).toBe('ひゃく');
      expect(numberToKana(300)).toBe('さんびゃく');
      expect(numberToKana(600)).toBe('ろっぴゃく');
      expect(numberToKana(800)).toBe('はっぴゃく');
    });

    test('converts regular hundreds', () => {
      expect(numberToKana(200)).toBe('にひゃく');
      expect(numberToKana(400)).toBe('よんひゃく');
      expect(numberToKana(500)).toBe('ごひゃく');
      expect(numberToKana(700)).toBe('ななひゃく');
      expect(numberToKana(900)).toBe('きゅうひゃく');
    });

    test('converts complex hundreds', () => {
      expect(numberToKana(123)).toBe('ひゃくにじゅうさん');
      expect(numberToKana(456)).toBe('よんひゃくごじゅうろく');
      expect(numberToKana(789)).toBe('ななひゃくはちじゅうきゅう');
      expect(numberToKana(999)).toBe('きゅうひゃくきゅうじゅうきゅう');
    });
  });

  describe('Thousands (1000-9999)', () => {
    test('converts thousands with special pronunciations', () => {
      expect(numberToKana(1000)).toBe('せん');
      expect(numberToKana(3000)).toBe('さんぜん');
      expect(numberToKana(8000)).toBe('はっせん');
    });

    test('converts regular thousands', () => {
      expect(numberToKana(2000)).toBe('にせん');
      expect(numberToKana(4000)).toBe('よんせん');
      expect(numberToKana(5000)).toBe('ごせん');
      expect(numberToKana(6000)).toBe('ろくせん');
      expect(numberToKana(7000)).toBe('ななせん');
      expect(numberToKana(9000)).toBe('きゅうせん');
    });

    test('converts complex thousands', () => {
      expect(numberToKana(1234)).toBe('せんにひゃくさんじゅうよん');
      expect(numberToKana(5678)).toBe('ごせんろっぴゃくななじゅうはち');
      expect(numberToKana(9999)).toBe('きゅうせんきゅうひゃくきゅうじゅうきゅう');
    });
  });

  describe('Large numbers (10,000+)', () => {
    test('converts 10,000 (man)', () => {
      expect(numberToKana(10000)).toBe('いちまん');
      expect(numberToKana(20000)).toBe('にまん');
      expect(numberToKana(30000)).toBe('さんまん');
    });

    test('converts numbers in the millions', () => {
      expect(numberToKana(100000)).toBe('じゅうまん');
      expect(numberToKana(123456)).toBe('じゅうにまんさんぜんよんひゃくごじゅうろく');
      expect(numberToKana(999999)).toBe('きゅうじゅうきゅうまんきゅうせんきゅうひゃくきゅうじゅうきゅう');
    });

    test('converts 100,000,000 (oku)', () => {
      expect(numberToKana(100000000)).toBe('いちおく');
      expect(numberToKana(200000000)).toBe('におく');
      expect(numberToKana(123456789)).toBe('いちおくにせんさんびゃくよんじゅうごまんろくせんななひゃくはちじゅうきゅう');
    });

    test('converts 1,000,000,000,000 (chou)', () => {
          expect(numberToKana(1000000000000)).toBe('いっちょう');
      expect(numberToKana(2000000000000)).toBe('にちょう');
          expect(numberToKana(1234567890123)).toBe('いちちょうにせんさんびゃくよんじゅうごおくろくせんななひゃくはちじゅうきゅうまんひゃくにじゅうさん');
    });

    test('converts very large numbers', () => {
      expect(numberToKana(1000000000000000)).toBe('せんちょう');
      expect(numberToKana(987654321098765)).toBe('きゅうひゃくはちじゅうななちょうろくせんごひゃくよんじゅうさんおくにせんひゃくきゅうまんはっせんななひゃくろくじゅうご');
    });
  });

  describe('Decimal numbers', () => {
    test('converts simple decimals', () => {
      expect(numberToKana(0.1)).toBe('れいてんいち');
      expect(numberToKana(0.5)).toBe('れいてんご');
      expect(numberToKana(1.5)).toBe('いちてんご');
      expect(numberToKana(2.3)).toBe('にてんさん');
    });

    test('converts decimals with multiple digits', () => {
      expect(numberToKana(3.14)).toBe('さんてんいちよん');
      expect(numberToKana(12.345)).toBe('じゅうにてんさんよんご');
      expect(numberToKana(99.999)).toBe('きゅうじゅうきゅうてんきゅうきゅうきゅう');
    });

    test('handles decimals with trailing zeros', () => {
      expect(numberToKana(5.0)).toBe('ご');
      expect(numberToKana(5.00)).toBe('ご');
      expect(numberToKana(7.50)).toBe('ななてんご');
      expect(numberToKana(10.100)).toBe('じゅうてんいち');
    });

    test('handles decimals starting with zero', () => {
      expect(numberToKana(0.01)).toBe('れいてんれいいち');
      expect(numberToKana(0.001)).toBe('れいてんれいれいいち');
    });
  });

  describe('Edge cases', () => {
    test('handles negative numbers', () => {
      expect(numberToKana(-1)).toBe('いち');
      expect(numberToKana('-5')).toBe('ご');
      expect(numberToKana(-123)).toBe('ひゃくにじゅうさん');
      expect(numberToKana('-9999')).toBe('きゅうせんきゅうひゃくきゅうじゅうきゅう');
    });

    test('handles numbers with leading zeros', () => {
      expect(numberToKana('001')).toBe('いち');
      expect(numberToKana('010')).toBe('じゅう');
      expect(numberToKana('000100')).toBe('ひゃく');
      expect(numberToKana('0000')).toBe('れい');
    });

    test('handles string inputs correctly', () => {
      expect(numberToKana('123')).toBe('ひゃくにじゅうさん');
      expect(numberToKana('4567')).toBe('よんせんごひゃくろくじゅうなな');
      expect(numberToKana('3.14159')).toBe('さんてんいちよんいちごきゅう');
    });

    test('handles very small numbers', () => {
      expect(numberToKana(1)).toBe('いち');
      expect(numberToKana(2)).toBe('に');
      expect(numberToKana(3)).toBe('さん');
    });
  });

  describe('Input validation', () => {
    test('normalizeNumberInput handles valid inputs', () => {
      expect(normalizeNumberInput(123)).toBe('123');
      expect(normalizeNumberInput('456')).toBe('456');
      expect(normalizeNumberInput('  789  ')).toBe('789');
      expect(normalizeNumberInput('3.14')).toBe('3.14');
    });

    test('normalizeNumberInput throws on invalid inputs', () => {
      expect(() => normalizeNumberInput(Infinity)).toThrow('Input must be finite');
      expect(() => normalizeNumberInput(NaN)).toThrow('Input must be finite');
      expect(() => normalizeNumberInput('abc')).toThrow('Invalid numeric format');
      expect(() => normalizeNumberInput('12.34.56')).toThrow('Invalid numeric format');
      expect(() => normalizeNumberInput('')).toThrow('Invalid numeric format');
    });

    test('getLastDigitOfInteger extracts correct digit', () => {
      expect(getLastDigitOfInteger('123')).toBe(3);
      expect(getLastDigitOfInteger('4567')).toBe(7);
      expect(getLastDigitOfInteger('0')).toBe(0);
      expect(getLastDigitOfInteger('10')).toBe(0);
      expect(getLastDigitOfInteger('3.14')).toBe(3);
      expect(getLastDigitOfInteger('99.99')).toBe(9);
    });
  });
});

