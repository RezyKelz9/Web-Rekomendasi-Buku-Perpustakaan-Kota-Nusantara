import { apiClient } from "./apiClient";
import type { LoanRecord, LoanStatus } from "../utils/loanUtils";

interface ApiLoan {
  id: number;
  user_id: number;
  book_id: number;
  title: string;
  author: string;
  cover: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  duration: number;
  fine: number;
  is_favorite: boolean;
  status: string;
  user_name: string;
  user_type: string;
  payment_status?: "unpaid" | "paid";
}

function toLoanRecord(api: ApiLoan): LoanRecord {
  return {
    id: `LOAN-${api.id}`,
    userId: String(api.user_id),
    bookId: String(api.book_id),
    title: api.title,
    author: api.author,
    cover: api.cover || "",
    borrowDate: api.borrowed_at,
    dueDate: api.due_at,
    returnDate: api.returned_at || undefined,
    duration: api.duration,
    status: api.status as LoanStatus,
    userName: api.user_name || "",
    userType: api.user_type || "Umum",
    fine: api.fine,
    isFavorite: api.is_favorite,
    paymentStatus: api.payment_status || undefined,
  };
}

export const loanApi = {
  async list(userId?: string, status?: string): Promise<LoanRecord[]> {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (status) params.set("status", status);
    const qs = params.toString();
    const res = await apiClient.get<ApiLoan[]>(`loans/index.php${qs ? `?${qs}` : ""}`);
    if (res.success && res.data) {
      return res.data.map(toLoanRecord);
    }
    return [];
  },

  async create(data: {
    userId: string;
    bookId: string;
    duration: number;
    userName?: string;
    userType?: string;
    isFavorite?: boolean;
  }): Promise<LoanRecord | null> {
    const res = await apiClient.post<ApiLoan>("loans/index.php", data);
    if (res.success && res.data) {
      return toLoanRecord(res.data);
    }
    return null;
  },

  async updateStatus(
    id: number,
    action: "approve" | "reject" | "return" | "confirm" | "pay",
    fine?: number
  ): Promise<boolean> {
    const body: Record<string, unknown> = { id, action };
    if (fine !== undefined) body.fine = fine;
    const res = await apiClient.put("loans/index.php", body);
    return res.success;
  },

  async delete(loanId: number): Promise<boolean> {
    const res = await apiClient.delete("loans/index.php", { id: loanId });
    return res.success;
  },

  extractNumericId(loanRecordId: string): number {
    const num = loanRecordId.replace("LOAN-", "");
    return parseInt(num, 10);
  },
};
