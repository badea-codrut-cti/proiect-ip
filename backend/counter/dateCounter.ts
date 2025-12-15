import { numberToKana } from './numberToKana';

const NON_STANDARD_DATES: Record<string, string> = {
  '1': 'ついたち',
  '2': 'ふつか',
  '3': 'みっか',
  '4': 'よっか',
  '5': 'いつか',
  '6': 'むいか',
  '7': 'なのか',
  '8': 'ようか',
  '9': 'ここのか',
  '10': 'とおか',
  '14': 'じゅうよっか',
  '20': 'はつか',
  '24': 'にじゅうよっか'
};

export function dateCounterToKana(day: number | string): string {
  const numericString = typeof day === 'number' ? day.toString() : day;

  if (numericString.includes('.')) {
    throw new Error('Day must not have decimals');
  }

  const cleanNumber = parseInt(numericString.replace(/^[+-]/, '').replace(/^0+/, '') || '0', 10);

  if (cleanNumber <= 0) {
    throw new Error('Day must be positive');
  }

  const dayString = cleanNumber.toString();

  if (NON_STANDARD_DATES[dayString]) {
    return NON_STANDARD_DATES[dayString];
  }

  return numberToKana(cleanNumber) + 'にち';
}

