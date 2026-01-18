import { ageCounterToKana } from './ageCounter.js';
import { dateCounterToKana } from './dateCounter.js';
import { digitEndingCounterToKana, digitEndingCounters } from './digitEndingCounter.js';

const COUNTERS: Record<string, (counter: string, number: number | string) => string> = {
  '歳': (_, number) => ageCounterToKana(number),
  '才': (_, number) => ageCounterToKana(number),
  '日': (_, number) => dateCounterToKana(number),
};

const DIGIT_ENDING_COUNTERS = Object.keys(digitEndingCounters);

export function counterToKana(counter: string, number: number | string): string {
  if (COUNTERS[counter]) {
    return COUNTERS[counter](counter, number);
  }

  if (DIGIT_ENDING_COUNTERS.includes(counter)) {
    return digitEndingCounterToKana(counter, number);
  }

  throw new Error(`Counter "${counter}" is not supported`);
}

export { ageCounterToKana, dateCounterToKana, digitEndingCounterToKana };

