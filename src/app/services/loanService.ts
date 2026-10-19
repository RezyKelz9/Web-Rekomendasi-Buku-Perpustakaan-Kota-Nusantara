export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  userType: "Umum" | "Pelajar" | "Dosen/Pengajar";
  status: "Menunggu" | "Dipinjam" | "Selesai" | "Ditolak";
  requestDate: string;
  dueDate?: string;
  fine: number;
  isFavorite?: boolean;
}

const LOANS_KEY = "perpus_loans";

export const loanService = {
  getLoans(): Loan[] {
    try {
      return JSON.parse(localStorage.getItem(LOANS_KEY) || "[]");
    } catch {
      return [];
    }
  },

  saveLoans(loans: Loan[]) {
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  },

  addLoans(newLoans: Omit<Loan, "id" | "status" | "requestDate" | "fine">[]) {
    const loans = this.getLoans();
    const today = new Date().toISOString().split("T")[0];
    
    const mapped = newLoans.map((loan, idx) => ({
      ...loan,
      id: `L-${Date.now()}-${idx}`,
      status: "Menunggu" as const,
      requestDate: today,
      fine: 0
    }));

    this.saveLoans([...loans, ...mapped]);
  },

  updateLoanStatus(id: string, status: Loan["status"], dueDate?: string) {
    const loans = this.getLoans();
    const idx = loans.findIndex(l => l.id === id);
    if (idx !== -1) {
      loans[idx].status = status;
      if (dueDate) loans[idx].dueDate = dueDate;
      this.saveLoans(loans);
    }
  }
};
