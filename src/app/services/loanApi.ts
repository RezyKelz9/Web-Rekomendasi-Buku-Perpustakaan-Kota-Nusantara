import { apiClient } from "./apiClient";
import type { LoanRecord, LoanStatus } from "../utils/loanUtils";

interface ApiLoan {
  id: number;
  transaction_code: string;
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
    transactionCode: api.transaction_code || "",
    userId: String(api.user_id),
    bookId: String(api.book_id),
    title: api.title,
    author: api.author,
    cover: api.cover || "",
    borrowDate: api.borrowed_at,
    dueDate: api.due_at,
    returnDate: api.returned_at || undefined,
    duration: Number(api.duration),
    status: api.status as LoanStatus,
    userName: api.user_name || "",
    userType: api.user_type || "Umum",
    fine: Number(api.fine),
    isFavorite: api.is_favorite,
    paymentStatus: api.payment_status || undefined,
  };
}

function toNumericId(value: string): number {
  return parseInt(String(value).replace(/^LOAN-/, ""), 10);
}

async function listLoans(params: {
  userId?: string;
  status?: string;
  id?: string;
  code?: string;
}): Promise<LoanRecord[]> {
  const search = new URLSearchParams();
  if (params.userId) search.set("userId", params.userId);
  if (params.status) search.set("status", params.status);
  if (params.id) search.set("id", params.id);
  if (params.code) search.set("code", params.code);
  const qs = search.toString();
  const res = await apiClient.get<ApiLoan[]>(`loans${qs ? `?${qs}` : ""}`);
  return res.success && res.data ? res.data.map(toLoanRecord) : [];
}

export const loanApi = {
  list(userId?: string, status?: string): Promise<LoanRecord[]> {
    return listLoans({ userId, status });
  },

  async get(id: string): Promise<LoanRecord | null> {
    const numericId = toNumericId(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return null;
    const loans = await listLoans({ id: String(numericId) });
    return loans[0] || null;
  },

  async findByCode(code: string): Promise<LoanRecord | null> {
    const loans = await listLoans({ code });
    return loans[0] || null;
  },

  async create(data: {
    userId: string;
    bookId: string;
    duration: number;
    userName?: string;
    userType?: string;
    isFavorite?: boolean;
  }): Promise<LoanRecord | null> {
    const res = await apiClient.post<ApiLoan>("loans", data);
    return res.success && res.data ? toLoanRecord(res.data) : null;
  },

  async updateStatus(
    id: number,
    action: "approve" | "reject" | "return" | "confirm" | "pay",
    fine?: number
  ): Promise<boolean> {
    const body: Record<string, unknown> = { id, action };
    if (fine !== undefined) body.fine = fine;
    const res = await apiClient.put("loans", body);
    return res.success;
  },

  async delete(loanId: number): Promise<boolean> {
    const res = await apiClient.delete("loans", { id: loanId });
    return res.success;
  },

  extractNumericId(loanRecordId: string): number {
    return toNumericId(loanRecordId);
  },
};
