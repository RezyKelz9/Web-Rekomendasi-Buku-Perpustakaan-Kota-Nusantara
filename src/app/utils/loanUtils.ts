export type LoanStatus = "Menunggu" | "Dipinjam" | "Dikembalikan" | "Selesai" | "Ditolak";

export interface LoanRecord {
  id: string;
  transactionCode: string;
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

export const DEFAULT_SETTINGS: LibrarySettings = {
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

export function getLoanDurationByMemberType(
  memberType: string,
  settings: LibrarySettings = DEFAULT_SETTINGS
): number {
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return settings.durasiDosen;
  if (normalized.includes("pelajar")) return settings.durasiPelajar;
  return settings.durasiUmum;
}

export function getFinePerDayByMemberType(
  memberType: string,
  settings: LibrarySettings = DEFAULT_SETTINGS
): number {
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return settings.dendaDosen;
  if (normalized.includes("pelajar")) return settings.dendaPelajar;
  return settings.dendaUmum;
}

export function calculateFine(
  memberType: string,
  overdueDays: number,
  isFavorite: boolean = false,
  settings: LibrarySettings = DEFAULT_SETTINGS
): number {
  if (overdueDays <= 0) return 0;
  const baseFine = getFinePerDayByMemberType(memberType, settings);
  const favoriteExtra = isFavorite ? settings.dendaBukuFavorit : 0;
  return (baseFine + favoriteExtra) * overdueDays;
}

export function getOverdueDays(dueDateIso: string): number {
  const dueDate = new Date(dueDateIso);
  const now = new Date();
  const diff = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function getRemainingDays(dueDateIso: string): number {
  const dueDate = new Date(dueDateIso);
  const now = new Date();
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatLoanDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getMaxBooksByMemberType(
  memberType: string,
  settings: LibrarySettings = DEFAULT_SETTINGS
): number {
  const normalized = memberType?.toLowerCase() || "";
  if (normalized.includes("dosen") || normalized.includes("pengajar")) return settings.batasBukuDosen;
  if (normalized.includes("pelajar")) return settings.batasBukuPelajar;
  return settings.batasBukuUmum;
}
