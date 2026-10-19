import { Book } from "../data/libraryData";
import { loanApi } from "../services/loanApi";
import { checkBackend } from "../services/apiClient";

export type LoanStatus = "Menunggu" | "Dipinjam" | "Dikembalikan" | "Selesai" | "Ditolak";

export interface LoanRecord {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  author: string;
  cover: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  duration: number;
  status: LoanStatus;
  userName?: string;
  userType?: string;
  fine: number;
  isFavorite?: boolean;
  paymentStatus?: "unpaid" | "paid";
}

export interface LibrarySettings {
  durasiUmum: number;
  durasiPelajar: number;
  durasiDosen: number;
  dendaUmum: number;
  dendaPelajar: number;
  dendaDosen: number;
  dendaBukuFavorit: number;
  batasBukuUmum: number;
  batasBukuPelajar: number;
  batasBukuDosen: number;
}

const SETTINGS_KEY = "librarySettings";
const LOANS_KEY = "perpus_loans";

const DEFAULT_SETTINGS: LibrarySettings = {
  durasiUmum: 7,
  durasiPelajar: 14,
  durasiDosen: 90,
  dendaUmum: 4000,
  dendaPelajar: 1000,
  dendaDosen: 0,
  dendaBukuFavorit: 2000,
  batasBukuUmum: 2,
  batasBukuPelajar: 3,
  batasBukuDosen: 5,
};

export function loadSettings(): LibrarySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: LibrarySettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ─── Loan CRUD (sync — localStorage) ───────────────────────────────────── */

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

export function getOutstandingFineForUser(userId: string): number {
  return loadLoansForUser(userId).reduce((total, loan) => {
    if (loan.status !== "Dipinjam" && loan.status !== "Dikembalikan") {
      return total;
    }
    const calculatedFine = calculateFine(
      loan.userType || "Umum",
      getOverdueDays(loan.dueDate),
      loan.isFavorite
    );
    return total + Math.max(loan.fine || 0, calculatedFine);
  }, 0);
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
    status: "Menunggu",
    fine: 0,
  };
}

/* ─── Sync dari API ke localStorage (opsional — dijalankan saat startup) ── */

export async function initLoanSync() {
  const backendUp = await checkBackend();
  if (!backendUp) return;

  const apiLoans = await loanApi.list();
  if (apiLoans.length > 0) {
    saveLoans(apiLoans);
  }
}

/* ─── Helper ────────────────────────────────────────────────────────────── */

export function getLoanDurationByMemberType(memberType: string): number {
  const settings = loadSettings();
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return settings.durasiDosen;
  if (normalized.includes("pelajar")) return settings.durasiPelajar;
  return settings.durasiUmum;
}

export function getFinePerDayByMemberType(memberType: string): number {
  const settings = loadSettings();
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return settings.dendaDosen;
  if (normalized.includes("pelajar")) return settings.dendaPelajar;
  return settings.dendaUmum;
}

export function calculateFine(
  memberType: string,
  overdueDays: number,
  isFavorite: boolean = false
): number {
  if (overdueDays <= 0) return 0;
  const baseFine = getFinePerDayByMemberType(memberType);
  const settings = loadSettings();
  const favoriteExtra = isFavorite ? settings.dendaBukuFavorit : 0;
  return (baseFine + favoriteExtra) * overdueDays;
}

export function getOverdueDays(dueDateIso: string): number {
  const dueDate = new Date(dueDateIso);
  const now = new Date();
  const diff = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
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

export function getMaxBooksByMemberType(memberType: string): number {
  const settings = loadSettings();
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return settings.batasBukuDosen;
  if (normalized.includes("pelajar")) return settings.batasBukuPelajar;
  return settings.batasBukuUmum;
}
