import { Book } from "../data/libraryData";

export type LoanStatus = "active" | "returned";

export interface LoanRecord {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  author: string;
  cover: string;
  borrowDate: string;
  dueDate: string;
  duration: number;
  status: LoanStatus;
}

export const LOANS_KEY = "perpus_loans";

export function loadLoans(): LoanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLoans(loans: LoanRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
}

export function loadLoansForUser(userId: string): LoanRecord[] {
  return loadLoans().filter((loan) => loan.userId === userId);
}

export function saveLoansForUser(userId: string, loans: LoanRecord[]) {
  const others = loadLoans().filter((loan) => loan.userId !== userId);
  saveLoans([...others, ...loans]);
}

export function createLoanRecord(
  book: Pick<Book, "id" | "title" | "author" | "cover">,
  userId: string,
  duration: number
): LoanRecord {
  const borrowDate = new Date();
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + duration);

  return {
    id: `LOAN-${Date.now()}-${book.id}`,
    userId,
    bookId: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover,
    borrowDate: borrowDate.toISOString(),
    dueDate: dueDate.toISOString(),
    duration,
    status: "active",
  };
}

export function getLoanDurationByMemberType(memberType: string): number {
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("pelajar")) return 14;
  if (normalized.includes("premium")) return 14;
  if (normalized.includes("guru") || normalized.includes("dosen")) return 30;
  return 7;
}

export function getRemainingDays(dueDateIso: string) {
  const dueDate = new Date(dueDateIso);
  const now = new Date();
  const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function formatLoanDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
