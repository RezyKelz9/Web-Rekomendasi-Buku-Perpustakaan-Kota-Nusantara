const RATINGS_KEY = "perpus_ratings";

export interface LoanRating {
  userId: string;
  loanId: string;
  rating: number;
  timestamp: number;
}

export function loadRatings(): LoanRating[] {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (raw) return JSON.parse(raw) as LoanRating[];
  } catch {}
  return [];
}

export function saveRatings(ratings: LoanRating[]): void {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  } catch {}
}

export function getUserRating(userId: string, loanId: string): number | null {
  const ratings = loadRatings();
  const found = ratings.find((r) => r.userId === userId && r.loanId === loanId);
  return found ? found.rating : null;
}

export function submitRating(userId: string, loanId: string, rating: number): void {
  const ratings = loadRatings();
  const idx = ratings.findIndex((r) => r.userId === userId && r.loanId === loanId);
  if (idx >= 0) {
    ratings[idx] = { userId, loanId, rating, timestamp: Date.now() };
  } else {
    ratings.push({ userId, loanId, rating, timestamp: Date.now() });
  }
  saveRatings(ratings);
  import("../services/ratingApi").then(({ ratingApi }) => ratingApi.submit(loanId, userId, rating));
}
