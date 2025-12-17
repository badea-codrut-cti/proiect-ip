export function calculateXp(
  isCorrect: boolean,
  attempts: number,
  timeSeconds: number
): number {
  if (!isCorrect) return 0;

  let xp = 10;

  if (attempts === 1) xp += 5;
  if (timeSeconds <= 10) xp += 5;

  return Math.min(xp, 25);
}
