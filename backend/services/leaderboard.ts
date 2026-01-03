import { Rating } from "ts-fsrs";

/**
 * Calculates the points to be awarded for the weekly race based on the review rating.
 * 
 * Rules:
 * - Easy: 20 points
 * - Good: 10 points
 * - Hard: 5 points
 * - Again: 0 points
 * 
 * This is just an example of what the weekly point system could look like and can be adjusted as needed.
 */
export function calculateWeeklyPoints(rating: Rating): number {
  switch (rating) {
    case Rating.Easy:
      return 20;
    case Rating.Good:
      return 10;
    case Rating.Hard:
      return 5;
    case Rating.Again:
    default:
      return 0;
  }
}

export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
