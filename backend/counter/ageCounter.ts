import { numberToKana } from './numberToKana.js';

export function ageCounterToKana(number: number | string): string {
  const numericString = typeof number === 'number' ? number.toString() : number;

  if (numericString.includes('.')) {
    throw new Error('Age must not have decimals');
  }

  const cleanNumber = parseInt(numericString.replace(/^[+-]/, '').replace(/^0+/, '') || '0', 10);

  if (cleanNumber === 20) {
    return 'はたち';
  }

  return numberToKana(number) + 'さい';
}

