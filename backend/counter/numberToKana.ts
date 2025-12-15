const DIGITS: Record<string, string> = {
  '0': 'れい',
  '1': 'いち',
  '2': 'に',
  '3': 'さん',
  '4': 'よん',
  '5': 'ご',
  '6': 'ろく',
  '7': 'なな',
  '8': 'はち',
  '9': 'きゅう'
};

const POWERS: Record<string, string> = {
  '10': 'じゅう',
  '100': 'ひゃく',
  '1000': 'せん',
  '10000': 'まん',
  '100000000': 'おく',
  '1000000000000': 'ちょう'
};

const SPECIALS: Record<string, string> = {
  '300': 'さんびゃく',
  '600': 'ろっぴゃく',
  '800': 'はっぴゃく',
  '3000': 'さんぜん',
  '8000': 'はっせん'
};

function normalizeNumberInput(input: number | string): string {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error('Input must be finite');
    return input.toString();
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) throw new Error('Invalid numeric format');
    return trimmed;
  }
  throw new Error('Input must be a number or numeric string');
}

function getLastDigitOfInteger(numericString: string): number {
  const [intPart] = numericString.split('.');
  const stripped = intPart.replace(/^0+/, '') || '0';
  return parseInt(stripped[stripped.length - 1], 10);
}

function convertChunk(chunk: string): string {
  if (chunk === '0') return '';

  if (chunk.length === 1) return DIGITS[chunk];

  if (SPECIALS[chunk]) return SPECIALS[chunk];

  if (chunk === '10') return POWERS['10'];
  if (chunk === '100') return POWERS['100'];
  if (chunk === '1000') return POWERS['1000'];

  let result = '';
  const len = chunk.length;

  for (let i = 0; i < len; i++) {
    const digit = chunk[i];
    if (digit === '0') continue;

    const place = len - i - 1;

    if (place === 0) {
      result += DIGITS[digit];
    } else if (place === 1) {
      // Tens place (10-90)
      if (digit === '1') {
        result += POWERS['10'];
      } else {
        result += DIGITS[digit] + POWERS['10'];
      }
    } else if (place === 2) {
      const twoDigitKey = digit + '00';
      if (SPECIALS[twoDigitKey]) {
        result += SPECIALS[twoDigitKey];
      } else if (digit === '1') {
        result += POWERS['100'];
      } else {
        result += DIGITS[digit] + POWERS['100'];
      }
    } else if (place === 3) {
      const threeDigitKey = digit + '000';
      if (SPECIALS[threeDigitKey]) {
        result += SPECIALS[threeDigitKey];
      } else if (digit === '1') {
        result += POWERS['1000'];
      } else {
        result += DIGITS[digit] + POWERS['1000'];
      }
    }
  }

  return result;
}

function numberToKana(input: number | string): string {
  const numericString = normalizeNumberInput(input);
  const cleanString = numericString.replace(/^[+-]/, '');
  const [intPart, fracPart] = cleanString.split('.');

  const intStr = intPart.replace(/^0+/, '') || '0';

  if (intStr === '0' && (!fracPart || fracPart === '0')) {
    return DIGITS['0'];
  }

  if (intStr === '1000000000000') {
    return 'いっちょう';
  }

  let result = '';

  if (intStr !== '0') {
    const chunks: string[] = [];
    let remaining = intStr;

    while (remaining.length > 4) {
      chunks.push(remaining.slice(-4));
      remaining = remaining.slice(0, -4);
    }
    chunks.push(remaining);
    chunks.reverse();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkResult = convertChunk(chunk);

      if (chunkResult) {
        result += chunkResult;

        const powerIndex = chunks.length - i - 1;
        if (powerIndex > 0) {
          if (powerIndex === 1) {
            result += POWERS['10000'];
          } else if (powerIndex === 2) {
            result += POWERS['100000000'];
          } else if (powerIndex === 3) {
            result += POWERS['1000000000000'];
          }
        }
      }
    }
  }

  if (fracPart) {
    const fracStr = fracPart.replace(/0+$/, '');
    if (fracStr) {
      if (intStr === '0') {
        result += DIGITS['0'];
      }
      result += 'てん';
      for (let i = 0; i < fracStr.length; i++) {
        result += DIGITS[fracStr[i]];
      }
    }
  }

  return result;
}

export { numberToKana, normalizeNumberInput, getLastDigitOfInteger };

