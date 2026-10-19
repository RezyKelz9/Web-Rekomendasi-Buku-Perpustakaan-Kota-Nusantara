import { apiClient } from "./apiClient";

export const ratingApi = {
  async submit(loanId: string, userId: string, rating: number): Promise<boolean> {
    try {
      const numericId = loanId.replace("LOAN-", "");
      const res = await apiClient.post("ratings/index.php", { loanId: numericId, userId, rating });
      return res.success;
    } catch {
      return false;
    }
  },
};
