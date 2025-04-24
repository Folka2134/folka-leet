type DifficultyRating = "Easy" | "Medium" | "Hard";

/**
 * Calculate the next review date based on the difficulty rating and review count
 * Using a simplified version of the SM-2 algorithm used by Anki
 */
export function calculateNextReviewDate(
  difficultyRating: DifficultyRating,
  reviewCount: number,
): Date {
  // Base intervals in days for each difficulty level
  const baseIntervals = {
    Easy: 3,
    Medium: 2,
    Hard: 1,
  };

  // Get the base interval for the selected difficulty
  const baseInterval = baseIntervals[difficultyRating];

  // Calculate the interval multiplier based on review count
  // First review uses the base interval, then we increase exponentially
  const intervalMultiplier =
    reviewCount === 0 ? 1 : Math.pow(2, reviewCount - 1);

  // Calculate days until next review
  const daysUntilNextReview = Math.round(baseInterval * intervalMultiplier);

  // Calculate the next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilNextReview);

  return nextReviewDate;
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0];
}
