import { Book, books as staticBooks } from "../data/libraryData";

const STORAGE_KEY = "admin_books_data";

export function loadBookData(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Book[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return staticBooks.map((b) => ({ ...b, recommended: false }));
}

export function saveBookData(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch {}
}
