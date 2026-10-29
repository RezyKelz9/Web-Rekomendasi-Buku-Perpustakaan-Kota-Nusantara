import { apiClient } from "./apiClient";

export interface RatingRecord {
  id: number;
  loan_id: number;
  user_id: number;
  rating: number;
  created_at: string;
  book_id: number;
  title: string;
}

export const ratingApi = {
  async list(userId?: string, loanId?: string): Promise<RatingRecord[]> {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (loanId) params.set("loanId", loanId);
    const qs = params.toString();
    const res = await apiClient.get<RatingRecord[]>(`ratings/index.php${qs ? `?${qs}` : ""}`);
    return res.success && res.data ? res.data : [];
  },

  async submit(loanId: string, userId: string, rating: number): Promise<boolean> {
    const numericId = loanId.replace("LOAN-", "");
    const res = await apiClient.post("ratings/index.php", { loanId: numericId, userId, rating });
    return res.success;
  },
};
